"use client";

import React, { useState, useEffect, useRef } from "react";
import localforage from "localforage";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Mail, Settings, LogOut, Zap, Image as ImageIcon, File, Send, Sun, Moon } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [postText, setPostText] = useState("");
  const [fields, setFields] = useState({
    email: "", company: "", jobTitle: "", recipientName: "Hiring Team", skills: "",
  });
  const [userProfile, setUserProfile] = useState({ name: "", phone: "", linkedin: "" });
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [settings, setSettings] = useState({
    GEMINI_API_KEY: "", GEMINI_MODEL: "gemini-3.5-flash",
    GMAIL_USER: "", GMAIL_APP_PASSWORD: "",
    USER_NAME: "", USER_PHONE: "", USER_LINKEDIN: "",
  });

  const [activeTab, setActiveTab] = useState("preview");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [hasGmailConfig, setHasGmailConfig] = useState(false);
  const [resumeExists, setResumeExists] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [logs, setLogs] = useState([]);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [screenshotData, setScreenshotData] = useState(null);
  const [screenshotName, setScreenshotName] = useState("");

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  useEffect(() => {
    setMounted(true);
    if (status === "authenticated") {
      loadSettings();
      addLog("Dashboard initialized. Ready to process jobs.", "info");
    }
  }, [status]);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const parsed = await res.json();
      if (parsed && Object.keys(parsed).length > 0 && !parsed.error) {
        setSettings(prev => ({ ...prev, ...parsed }));
        setUserProfile({ name: parsed.USER_NAME || "", phone: parsed.USER_PHONE || "", linkedin: parsed.USER_LINKEDIN || "" });
        setHasGeminiKey(!!parsed.GEMINI_API_KEY);
        setHasGmailConfig(!!parsed.GMAIL_USER && !!parsed.GMAIL_APP_PASSWORD);
        if (parsed.GEMINI_API_KEY) {
          fetchAvailableModels(parsed.GEMINI_API_KEY);
        }
      }
      
      const storedResume = await localforage.getItem("automailer_resume");
      if (storedResume) {
        setResumeFile(storedResume);
        setResumeExists(true);
        addLog("Default resume loaded from browser storage.", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAvailableModels = async (key) => {
    const apiKeyToUse = key || settings.GEMINI_API_KEY;
    if (!apiKeyToUse) return;

    setIsFetchingModels(true);
    try {
      const res = await fetch("/api/models", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userApiKey: apiKeyToUse }),
      });
      const data = await res.json();
      if (res.ok) setAvailableModels(data.models || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetchingModels(false);
    }
  };

  useEffect(() => {
    if (settingsOpen && (settings.GEMINI_API_KEY || hasGeminiKey)) fetchAvailableModels();
  }, [settingsOpen]);

  const compileTemplate = () => {
    const pTitle = fields.jobTitle || "[Position Title]";
    const pSkills = fields.skills || "[your field/technology/domain]";
    const uName = fields.userName || userProfile.name || "[Your Name]";
    const uPhone = fields.userPhone || userProfile.phone || "[Phone Number]";
    const uLink = fields.userLinkedin || userProfile.linkedin || "[LinkedIn Profile]";
    
    let salutation = "Dear Hiring Team,";
    if (fields.recipientName && fields.recipientName.toLowerCase() !== "hiring team") {
      salutation = `Dear ${fields.recipientName},`;
    }

    const body = `${salutation}\n\nI hope you are doing well.\n\nI am interested in the ${pTitle} role at your company. I have experience in ${pSkills} and believe my skills align well with the requirements.\n\nPlease find my resume attached for your review. I would appreciate the opportunity to discuss how I can contribute to your team.\n\nThank you for your time and consideration.\n\nBest regards,\n\n${uName}\n${uPhone}\n${uLink}`;
    setSubject(`Application for ${pTitle} - ${uName}`);
    setEmailBody(body);
  };

  useEffect(() => { compileTemplate(); }, [fields, userProfile]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      setUserProfile({ name: settings.USER_NAME, phone: settings.USER_PHONE, linkedin: settings.USER_LINKEDIN });
      setHasGeminiKey(!!settings.GEMINI_API_KEY);
      setHasGmailConfig(!!settings.GMAIL_USER && !!settings.GMAIL_APP_PASSWORD);
      addLog("Settings saved successfully.", "success");
      setSettingsOpen(false);
    } catch (e) {
      addLog(`Error saving settings: ${e.message}`, "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      addLog("Only PDF files are supported.", "error");
      return;
    }
    setIsUploading(true);
    try {
      await localforage.setItem("automailer_resume", file);
      setResumeFile(file);
      setResumeExists(true);
      addLog("Resume saved securely in browser.", "success");
    } catch (error) {
      addLog("Error saving resume.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUploadClick = () => imageInputRef.current.click();
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScreenshotName(file.name);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleParsePost = async () => {
    if (!postText.trim() && !screenshotData) return;
    setIsParsing(true);
    addLog("Sending to Gemini...", "info");
    
    const base64Image = screenshotData ? screenshotData.split(",")[1] : null;
    const mimeType = screenshotData ? screenshotData.split(";")[0].split(":")[1] : null;

    try {
      const res = await fetch("/api/parse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          postText, 
          image: base64Image,
          mimeType,
          userApiKey: settings.GEMINI_API_KEY, 
          userModel: settings.GEMINI_MODEL 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFields({
          email: data.email || "", company: data.company || "", jobTitle: data.jobTitle || "",
          recipientName: data.recipientName || "Hiring Team", skills: data.skills || "",
        });
        setActiveTab("preview");
        addLog("Extracted successfully.", "success");
      } else {
        addLog(`Error: ${data.error}`, "error");
      }
    } catch (error) {
      addLog(`Error: ${error.message}`, "error");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!fields.email || !resumeExists || !hasGmailConfig) return;
    setIsSending(true);
    addLog(`Sending application to ${fields.email}...`, "info");

    const formData = new FormData();
    formData.append("toEmail", fields.email);
    formData.append("subject", subject);
    formData.append("emailBody", emailBody);
    formData.append("gmailUser", settings.GMAIL_USER);
    formData.append("gmailAppPassword", settings.GMAIL_APP_PASSWORD);
    formData.append("resume", resumeFile);

    try {
      const res = await fetch("/api/send", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) addLog(`Email sent to ${fields.email}!`, "success");
      else addLog(`Send failed: ${data.error}`, "error");
    } catch (error) {
      addLog(`Error: ${error.message}`, "error");
    } finally {
      setIsSending(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="app-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh'}}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '3rem 2rem' }}>
          <div className="logo-icon" style={{ display: 'inline-block', marginBottom: '1rem', width: '40px', height: '40px', lineHeight: '40px' }}>AM</div>
          <h2 style={{ marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>AutoMailer</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Sign in with Google to securely sync your configuration across devices.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => signIn("google")}>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="floating-nav">
        <div className="logo-section">
          <div className="nav-logo">
            <Mail size={18} className="nav-logo-icon" />
          </div>
          <div>
            <h1 className="nav-title">AutoMailer</h1>
          </div>
        </div>
        <div className="nav-actions">
          {mounted && (
            <button
              className="icon-btn"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">
            <Settings size={18} />
          </button>
          <button className="icon-btn" onClick={() => signOut()} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="dashboard-grid">
        
        {/* Left Side: Input */}
        <div className="card" style={{ height: "100%" }}>
          <div className="card-header">
            <div className="card-title">
              LinkedIn Post / Job Description
            </div>
            <span className="char-counter">{postText.length} chars</span>
          </div>
          
          <div className="form-group" style={{ flexGrow: 1 }}>
            <textarea
              className="post-input"
              placeholder="Paste the LinkedIn post description or job listing content here. Our Gemini extractor will pull out the target email, position, skills, and manager details..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
          </div>
          
          <div className="status-text" style={{ minHeight: "1rem" }}>
            {logs.length > 0 && logs[logs.length - 1].message}
          </div>
          
          <div className="flex-row" style={{ marginBottom: "1rem", gap: "1rem", alignItems: "center" }}>
            <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }} onClick={handleImageUploadClick}>
              <ImageIcon size={14} /> Upload
            </button>
            <input type="file" ref={imageInputRef} style={{ display: "none" }} accept="image/*" onChange={handleImageChange} />
            {screenshotName && <span style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>{screenshotName}</span>}
            {screenshotName && <button style={{background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer"}} onClick={() => {setScreenshotData(null); setScreenshotName("");}}>✕</button>}
          </div>

          <button
            className="btn btn-primary"
            disabled={isParsing || (!postText.trim() && !screenshotData)}
            onClick={handleParsePost}
          >
            {isParsing ? (
              <>
                <div className="spinner"></div> Extracting details...
              </>
            ) : (
              <>
                <Zap size={16} /> Extract
              </>
            )}
          </button>
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
                  Email Preview
                </button>
                <button
                  className={`tab ${activeTab === "details" ? "active" : ""}`}
                  onClick={() => setActiveTab("details")}
                >
                  Extracted Fields
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
                    <div className="flex-gap-2">
                      <span>Attachment:</span>
                      <span style={{color: "var(--text-primary)"}}>{resumeExists ? "Resume.pdf" : "None"}</span>
                    </div>
                    <button className="btn btn-secondary" style={{padding: "0.25rem 0.5rem", fontSize: "0.75rem"}} onClick={handleUploadClick}>
                      {isUploading ? "Uploading..." : <><File size={12} /> Upload</>}
                    </button>
                    <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".pdf" onChange={handleFileChange} />
                  </div>
                  
                  <button
                    className="btn btn-success"
                    disabled={isSending || !fields.email || !resumeExists || !hasGmailConfig}
                    onClick={handleSendEmail}
                  >
                    {isSending ? (
                      <>
                        <div className="spinner"></div> Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Send
                      </>
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

          <div className="form-group">
            <label>Gemini Model {isFetchingModels && <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)" }}>(loading...)</span>}</label>
            <select
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                outline: "none",
                cursor: "pointer"
              }}
              value={["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-pro", "gemini-2.5-flash"].includes(settings.GEMINI_MODEL) || availableModels.some(m => m.name === settings.GEMINI_MODEL) ? settings.GEMINI_MODEL : "custom"}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setSettings({ ...settings, GEMINI_MODEL: "gemini-3.5-flash" }); // Default custom model
                } else {
                  setSettings({ ...settings, GEMINI_MODEL: e.target.value });
                }
              }}
            >
              {availableModels.length > 0 ? (
                availableModels.map(m => (
                  <option key={m.name} value={m.name}>{m.displayName}</option>
                ))
              ) : (
                <>
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                  <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                </>
              )}
              <option value="custom">Custom Model...</option>
            </select>
            
            {(!["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-pro", "gemini-2.5-flash"].includes(settings.GEMINI_MODEL) && 
              !availableModels.some(m => m.name === settings.GEMINI_MODEL)) && (
              <input
                type="text"
                placeholder="Enter custom model identifier"
                value={settings.GEMINI_MODEL}
                onChange={(e) => setSettings({ ...settings, GEMINI_MODEL: e.target.value })}
                style={{ marginTop: "0.5rem" }}
              />
            )}
            
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Select which Gemini model version to use for parsing.
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
