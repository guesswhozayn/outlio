import React, { useState, useEffect, useRef } from "react";

// API Base URL (running locally)
const API_URL = "http://localhost:5000";

function App() {
  // Post state
  const [postText, setPostText] = useState("");
  
  // Extracted/Editable fields
  const [fields, setFields] = useState({
    email: "",
    company: "",
    jobTitle: "",
    recipientName: "Hiring Team",
    skills: "",
  });

  // User Profile from Settings
  const [userProfile, setUserProfile] = useState({
    name: "",
    phone: "",
    linkedin: "",
  });

  // Email subject and body
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // App settings drawer state
  const [settings, setSettings] = useState({
    GEMINI_API_KEY: "",
    GMAIL_USER: "",
    GMAIL_APP_PASSWORD: "",
    USER_NAME: "",
    USER_PHONE: "",
    USER_LINKEDIN: "",
  });

  // UI state
  const [activeTab, setActiveTab] = useState("preview"); // "details" or "preview"
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [hasGmailConfig, setHasGmailConfig] = useState(false);
  const [resumeExists, setResumeExists] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Logger state
  const [logs, setLogs] = useState([]);
  const fileInputRef = useRef(null);
  const consoleEndRef = useRef(null);

  // Add a log entry
  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, message, type }]);
  };

  // Scroll to bottom of console logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Load configuration on mount
  useEffect(() => {
    fetchSettings();
    addLog("Dashboard initialized. Ready to process jobs.", "info");
  }, []);

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`);
      const data = await res.json();
      
      setSettings({
        GEMINI_API_KEY: data.GEMINI_API_KEY || "",
        GMAIL_USER: data.GMAIL_USER || "",
        GMAIL_APP_PASSWORD: "", // Keep password hidden on fetch
        USER_NAME: data.USER_NAME || "",
        USER_PHONE: data.USER_PHONE || "",
        USER_LINKEDIN: data.USER_LINKEDIN || "",
      });

      setUserProfile({
        name: data.USER_NAME || "",
        phone: data.USER_PHONE || "",
        linkedin: data.USER_LINKEDIN || "",
      });

      setHasGeminiKey(data.hasGeminiKey);
      setHasGmailConfig(data.GMAIL_USER && data.hasGmailPassword);
      setResumeExists(data.resumeExists);

      if (data.resumeExists) {
        addLog("Default resume loaded (resume.pdf).", "success");
      } else {
        addLog("No resume found. Please upload a PDF resume.", "error");
      }
    } catch (error) {
      console.error(error);
      addLog("Failed to fetch backend settings. Make sure server is running on port 5000.", "error");
    }
  };

  // Compile the email template based on fields and user profile
  const compileTemplate = () => {
    const pTitle = fields.jobTitle || "[Position Title]";
    const pSkills = fields.skills || "[your field/technology/domain]";
    const uName = fields.userName || userProfile.name || "[Your Name]";
    const uPhone = fields.userPhone || userProfile.phone || "[Phone Number]";
    const uLink = fields.userLinkedin || userProfile.linkedin || "[LinkedIn Profile]";
    
    // Recipient format
    let salutation = "Dear Hiring Team,";
    if (fields.recipientName && fields.recipientName.toLowerCase() !== "hiring team") {
      salutation = `Dear ${fields.recipientName},`;
    }

    const body = `${salutation}

I hope you are doing well.

I am interested in the ${pTitle} role at your company. I have experience in ${pSkills} and believe my skills align well with the requirements.

Please find my resume attached for your review. I would appreciate the opportunity to discuss how I can contribute to your team.

Thank you for your time and consideration.

Best regards,

${uName}
${uPhone}
${uLink}`;

    const subj = `Application for ${pTitle} - ${uName}`;

    setSubject(subj);
    setEmailBody(body);
  };

  // Recompile template whenever fields or profile changes
  useEffect(() => {
    compileTemplate();
  }, [fields, userProfile]);

  // Handle settings update
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    addLog("Saving settings to server...", "info");
    
    try {
      const bodyToSend = { ...settings };
      // If password field is blank, do not overwrite it on server
      if (!bodyToSend.GMAIL_APP_PASSWORD) {
        delete bodyToSend.GMAIL_APP_PASSWORD;
      }

      const res = await fetch(`${API_URL}/api/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });
      const data = await res.json();
      
      if (data.success) {
        addLog("Settings updated successfully.", "success");
        setSettingsOpen(false);
        await fetchSettings();
      } else {
        addLog(`Settings save failed: ${data.error}`, "error");
      }
    } catch (error) {
      addLog(`Error saving settings: ${error.message}`, "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle Resume Upload
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      addLog("Only PDF files are supported for resume upload.", "error");
      return;
    }

    setIsUploading(true);
    addLog(`Uploading resume: ${file.name}...`, "info");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch(`${API_URL}/api/resume/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        addLog("Resume uploaded and set as default successfully.", "success");
        setResumeExists(true);
      } else {
        addLog(`Resume upload failed: ${data.error}`, "error");
      }
    } catch (error) {
      addLog(`Error uploading resume: ${error.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Call Gemini to Parse Post
  const handleParsePost = async () => {
    if (!postText.trim()) {
      addLog("Please paste LinkedIn post text first.", "error");
      return;
    }
    
    setIsParsing(true);
    addLog("Sending post to Gemini AI for metadata extraction...", "info");

    try {
      const res = await fetch(`${API_URL}/api/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postText,
          userApiKey: settings.GEMINI_API_KEY || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addLog("Successfully parsed LinkedIn post text.", "success");
        addLog(`Parsed Details: Company: "${data.company}", Position: "${data.jobTitle}", Email: "${data.email || 'None found'}"`, "info");
        
        setFields({
          email: data.email || "",
          company: data.company || "",
          jobTitle: data.jobTitle || "",
          recipientName: data.recipientName || "Hiring Team",
          skills: data.skills || "",
        });
        
        // Focus review panel
        setActiveTab("preview");
      } else {
        addLog(`Gemini parsing failed: ${data.error}`, "error");
      }
    } catch (error) {
      addLog(`Extraction API Error: ${error.message}`, "error");
    } finally {
      setIsParsing(false);
    }
  };

  // Send the application email
  const handleSendEmail = async () => {
    if (!fields.email) {
      addLog("Recipient email address is missing.", "error");
      return;
    }
    if (!resumeExists) {
      addLog("Cannot send email. Please upload a resume first.", "error");
      return;
    }
    if (!hasGmailConfig) {
      addLog("Gmail credentials are not configured. Click Settings (cog icon) to set up.", "error");
      return;
    }

    setIsSending(true);
    addLog(`Initiating application email to: ${fields.email}...`, "info");

    try {
      const res = await fetch(`${API_URL}/api/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: fields.email,
          subject: subject,
          emailBody: emailBody,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        addLog(`Email sent successfully to ${fields.email}! Response: ${data.info}`, "success");
      } else {
        addLog(`Failed to send email: ${data.error}`, "error");
      }
    } catch (error) {
      addLog(`Send Email API Error: ${error.message}`, "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header>
        <div className="logo-section">
          <div className="logo-icon">✉</div>
          <div>
            <h1>AutoMailer</h1>
            <div className="subtitle">LI-JOB APPLICATION BOT</div>
          </div>
        </div>
        <div className="flex-gap-2">
          {resumeExists ? (
            <span className="badge badge-success">✓ Resume Loaded</span>
          ) : (
            <span className="badge badge-danger">✗ Resume Missing</span>
          )}
          {hasGmailConfig ? (
            <span className="badge badge-success">✓ Gmail Ready</span>
          ) : (
            <span className="badge badge-danger">✗ Gmail Config</span>
          )}
          <button className="btn btn-secondary" onClick={() => setSettingsOpen(true)}>
            ⚙ Settings
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="dashboard-grid">
        
        {/* Left Side: Input & Upload */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Post Input Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span>📋</span> LinkedIn Post / Job Description
              </div>
              <span className="char-counter">{postText.length} chars</span>
            </div>
            
            <div className="form-group">
              <textarea
                className="post-input"
                placeholder="Paste the LinkedIn post description or job listing content here. Our Gemini extractor will pull out the target email, position, skills, and manager details..."
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
              />
            </div>
            
            <button
              className="btn btn-primary"
              disabled={isParsing || !postText.trim()}
              onClick={handleParsePost}
            >
              {isParsing ? (
                <>
                  <div className="spinner"></div> Extracting details...
                </>
              ) : (
                "🪄 Extract Job Details"
              )}
            </button>
          </div>

          {/* Resume Upload Card */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span>📄</span> Resume Management
              </div>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".pdf"
              onChange={handleFileChange}
            />

            <div className="upload-zone" onClick={handleUploadClick}>
              <div className="upload-icon">📤</div>
              <div>
                <strong>Click to upload your resume</strong>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Supports PDF formats. Saves as default file.
              </div>
            </div>

            {isUploading && (
              <div className="flex-row" style={{ justifyContent: "center" }}>
                <div className="spinner"></div> Uploading file...
              </div>
            )}
          </div>

          {/* Logs Card */}
          <div className="card" style={{ flexGrow: 1 }}>
            <div className="card-header">
              <div className="card-title">
                <span>💻</span> Application Terminal Logs
              </div>
              <button className="badge badge-neutral" style={{cursor: "pointer"}} onClick={() => setLogs([])}>
                Clear
              </button>
            </div>
            <div className="output-pane">
              {logs.length === 0 ? (
                <div className="output-line text-muted">No logs recorded yet. Action results will appear here.</div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className={`output-line ${log.type}`}>
                    [{log.timestamp}] {log.message}
                  </div>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>

        {/* Right Side: Review & Editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div className="card" style={{ height: "100%", justifyContent: "flex-start" }}>
            <div className="card-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
              <div className="tabs">
                <button
                  className={`tab ${activeTab === "preview" ? "active" : ""}`}
                  onClick={() => setActiveTab("preview")}
                >
                  ✉ Email Preview
                </button>
                <button
                  className={`tab ${activeTab === "details" ? "active" : ""}`}
                  onClick={() => setActiveTab("details")}
                >
                  🔍 Extracted Fields
                </button>
              </div>
            </div>

            {/* Tab content: Extracted Details */}
            {activeTab === "details" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
                
                <div className="form-group">
                  <label>HR Recipient Email</label>
                  <input
                    type="email"
                    placeholder="hr-email@company.com (Extracted)"
                    value={fields.email}
                    onChange={(e) => setFields({ ...fields, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Job Title (Position)</label>
                  <input
                    type="text"
                    placeholder="Software Engineer (Extracted)"
                    value={fields.jobTitle}
                    onChange={(e) => setFields({ ...fields, jobTitle: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    placeholder="Acme Corp (Extracted)"
                    value={fields.company}
                    onChange={(e) => setFields({ ...fields, company: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Hiring Manager / Team</label>
                  <input
                    type="text"
                    placeholder="Hiring Team / John Doe (Extracted)"
                    value={fields.recipientName}
                    onChange={(e) => setFields({ ...fields, recipientName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Key Technologies / Field</label>
                  <input
                    type="text"
                    placeholder="React, Node.js (Extracted)"
                    value={fields.skills}
                    onChange={(e) => setFields({ ...fields, skills: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Tab content: Email Editor & Sender */}
            {activeTab === "preview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem", flexGrow: 1 }}>
                
                <div className="form-group">
                  <label>To</label>
                  <input
                    type="email"
                    placeholder="hr-email@company.com (Set in fields)"
                    value={fields.email}
                    onChange={(e) => setFields({ ...fields, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    placeholder="Email Subject Line"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flexGrow: 1 }}>
                  <label>Email Body</label>
                  <textarea
                    style={{ flexGrow: 1, minHeight: "350px", fontFamily: "inherit" }}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                </div>

                <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div className="flex-row" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <span>Attachment:</span>
                    <span>{resumeExists ? "📎 Resume.pdf" : "⚠️ No resume attached"}</span>
                  </div>
                  
                  <button
                    className="btn btn-success"
                    disabled={isSending || !fields.email || !resumeExists || !hasGmailConfig}
                    onClick={handleSendEmail}
                  >
                    {isSending ? (
                      <>
                        <div className="spinner"></div> Sending Application...
                      </>
                    ) : (
                      "🚀 Send Email via Gmail"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Drawer */}
      <div className={`overlay ${settingsOpen ? "active" : ""}`} onClick={() => setSettingsOpen(false)}></div>
      
      <div className={`settings-drawer ${settingsOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h2>Configuration Settings</h2>
          <button className="close-btn" onClick={() => setSettingsOpen(false)}>×</button>
        </div>

        <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div className="form-group">
            <label>Gemini API Key</label>
            <input
              type="password"
              placeholder={hasGeminiKey ? "••••••••••••••••••••" : "Paste Gemini API Key"}
              value={settings.GEMINI_API_KEY}
              onChange={(e) => setSettings({ ...settings, GEMINI_API_KEY: e.target.value })}
            />
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              API key to power the LinkedIn post parsing capabilities.
            </small>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)" }} />

          <div className="form-group">
            <label>Gmail Address</label>
            <input
              type="email"
              placeholder="your-email@gmail.com"
              value={settings.GMAIL_USER}
              onChange={(e) => setSettings({ ...settings, GMAIL_USER: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Gmail App Password</label>
            <input
              type="password"
              placeholder={hasGmailConfig ? "••••••••••••••••••••" : "Paste Gmail App Password"}
              value={settings.GMAIL_APP_PASSWORD}
              onChange={(e) => setSettings({ ...settings, GMAIL_APP_PASSWORD: e.target.value })}
            />
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Must be a 16-character Google App Password. Normal password will fail.
            </small>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)" }} />

          <h3>User Signature Profile</h3>

          <div className="form-group">
            <label>Your Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={settings.USER_NAME}
              onChange={(e) => setSettings({ ...settings, USER_NAME: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="+1 (555) 019-2834"
              value={settings.USER_PHONE}
              onChange={(e) => setSettings({ ...settings, USER_PHONE: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>LinkedIn Profile URL</label>
            <input
              type="text"
              placeholder="linkedin.com/in/username"
              value={settings.USER_LINKEDIN}
              onChange={(e) => setSettings({ ...settings, USER_LINKEDIN: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }} disabled={isSavingSettings}>
            {isSavingSettings ? "Saving Settings..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
