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
  const [userProfile, setUserProfile] = useState({ name: "", phone: "", linkedin: "", github: "", portfolio: "" });
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [settings, setSettings] = useState({
    GEMINI_API_KEY: "", GEMINI_MODEL: "gemini-3.5-flash",
    GMAIL_USER: "", GMAIL_APP_PASSWORD: "",
    USER_NAME: "", USER_PHONE: "", USER_LINKEDIN: "", USER_GITHUB: "", USER_PORTFOLIO: "", USER_SKILLS: "",
  });

  const [activeTab, setActiveTab] = useState("preview");
  const [history, setHistory] = useState([]);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [isColdEmail, setIsColdEmail] = useState(false);
  const [coldEmailRole, setColdEmailRole] = useState("General");
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
      const email = session?.user?.email;
      let localSettings = {};
      if (email) {
        try {
          localSettings = await localforage.getItem(`automailer_settings_${email}`) || {};
        } catch (err) {
          console.warn("Browser storage access denied:", err);
        }
      }

      const res = await fetch("/api/settings", { cache: "no-store" });
      const parsed = await res.json();
      
      let finalSettings = { ...localSettings };

      if (parsed && Object.keys(parsed).length > 0 && !parsed.error) {
        // If server returns data (e.g., from KV), it overrides local
        const hasActualData = Object.values(parsed).some(val => val !== "");
        if (hasActualData) {
          finalSettings = { ...finalSettings, ...parsed };
        }
      }

      if (email && Object.keys(finalSettings).length > 0) {
        try {
          await localforage.setItem(`automailer_settings_${email}`, finalSettings);
        } catch (err) {
          console.warn("Browser storage access denied:", err);
        }
      }

      setSettings(prev => ({ ...prev, ...finalSettings }));
      setUserProfile({ 
        name: finalSettings.USER_NAME || "", 
        phone: finalSettings.USER_PHONE || "", 
        linkedin: finalSettings.USER_LINKEDIN || "",
        github: finalSettings.USER_GITHUB || "",
        portfolio: finalSettings.USER_PORTFOLIO || "",
        skills: finalSettings.USER_SKILLS || ""
      });
      setHasGeminiKey(!!finalSettings.GEMINI_API_KEY);
      setHasGmailConfig(!!finalSettings.GMAIL_USER && !!finalSettings.GMAIL_APP_PASSWORD);
      if (finalSettings.GEMINI_API_KEY) {
        fetchAvailableModels(finalSettings.GEMINI_API_KEY);
      }
      
      try {
        const storedHistory = await localforage.getItem("automailer_history");
        if (storedHistory) setHistory(storedHistory);
      } catch (err) {
        console.warn("Browser storage access denied for history:", err);
      }

      try {
        const storedResume = await localforage.getItem("automailer_resume");
        if (storedResume) {
          setResumeFile(storedResume);
          setResumeExists(true);
          addLog("Default resume loaded from browser storage.", "success");
        }
      } catch (err) {
        console.warn("Browser storage access denied for resume:", err);
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
    
    let domain = isColdEmail ? coldEmailRole : "General";
    if (domain === "General" && pTitle !== "[Position Title]") {
      const t = pTitle.toLowerCase();
      if (t.includes("front") || t.includes("ui") || t.includes("ux")) domain = "Frontend";
      else if (t.includes("back") || t.includes("api") || t.includes("data")) domain = "Backend";
      else if (t.includes("full") || t.includes("stack")) domain = "Full Stack";
    }

    const getRelevantSkills = (allSkills, targetDomain) => {
      if (!allSkills) return "";
      const skillsArray = allSkills.split(',').map(s => s.trim()).filter(Boolean);
      if (targetDomain === "General") return allSkills;
      
      const frontendKw = ['react', 'next', 'vue', 'angular', 'tailwind', 'css', 'html', 'bootstrap', 'javascript', 'typescript', 'js', 'ts', 'context', 'redux', 'zustand'];
      const backendKw = ['node', 'express', 'python', 'java', 'spring', 'c#', 'php', 'ruby', 'sql', 'postgres', 'mysql', 'mongo', 'redis', 'aws', 'docker', 'api', 'graphql', 'jwt', 'oauth', 'javascript', 'typescript', 'js', 'ts'];
      
      let relevant = [];
      if (targetDomain === "Frontend") {
        relevant = skillsArray.filter(s => frontendKw.some(k => s.toLowerCase().includes(k)));
      } else if (targetDomain === "Backend") {
        relevant = skillsArray.filter(s => backendKw.some(k => s.toLowerCase().includes(k)));
      } else if (targetDomain === "Full Stack") {
        const fe = skillsArray.filter(s => frontendKw.some(k => s.toLowerCase().includes(k))).slice(0, 3);
        const be = skillsArray.filter(s => backendKw.some(k => s.toLowerCase().includes(k))).slice(0, 3);
        relevant = [...new Set([...fe, ...be])];
      }
      
      if (relevant.length === 0) return allSkills;
      if (relevant.length === 1) return relevant[0];
      if (relevant.length === 2) return `${relevant[0]} and ${relevant[1]}`;
      return `${relevant.slice(0, -1).join(', ')}, and ${relevant[relevant.length - 1]}`;
    };

    let defaultSkills = "[your field/technology/domain]";
    
    if (userProfile.skills) {
      defaultSkills = getRelevantSkills(userProfile.skills, domain);
    }
    
    const pSkills = isColdEmail ? defaultSkills : (fields.skills || defaultSkills);

    const uName = fields.userName || userProfile.name || "[Your Name]";
    const uPhone = fields.userPhone || userProfile.phone || "[Phone Number]";
    const uLink = fields.userLinkedin || userProfile.linkedin || "[LinkedIn Profile]";
    const uGithub = userProfile.github ? `\n${userProfile.github}` : "\n[GitHub Profile]";
    const uPortfolio = userProfile.portfolio ? `\n${userProfile.portfolio}` : "";
    
    let salutation = "Dear Hiring Team,";
    if (fields.recipientName && fields.recipientName.toLowerCase() !== "hiring team") {
      salutation = `Dear ${fields.recipientName},`;
    }

    let body = "";
    let sub = "";

    if (isFollowUp) {
      body = `${salutation}\n\nI hope you are having a great week.\n\nI'm writing to follow up on my application for the ${pTitle} role${fields.company ? ` at ${fields.company}` : ''}. I remain very interested in the opportunity to join your team and would love to know if there are any updates regarding the hiring process.\n\nPlease let me know if you need any additional information or work samples from my end. I've re-attached my resume for your convenience.\n\nThank you again for your time and consideration.\n\nBest regards,\n\n${uName}\n${uPhone}\n${uLink}${uGithub}${uPortfolio}`;
      sub = `Following up - Application for ${pTitle} - ${uName}`;
    } else if (isColdEmail) {
      let roleText = pTitle;
      let contributionText = "contribute to your team and learn from your experts";
      
      if (domain === "Frontend") {
         roleText = "Frontend Developer";
         contributionText = "help build engaging, responsive user interfaces and learn from your engineering team";
      } else if (domain === "Backend") {
         roleText = "Backend Developer";
         contributionText = "help build scalable, robust server-side architecture and learn from your engineering team";
      } else if (domain === "Full Stack") {
         roleText = "Full Stack Developer";
         contributionText = "contribute across the stack to deliver end-to-end features and learn from your engineering team";
      }

      body = `${salutation}\n\nI hope you are doing well.\n\nI am writing to express my interest in any potential intern or junior ${roleText} opportunities at your company. With my background in ${pSkills}, I am eager to ${contributionText}.\n\nI have attached my resume for your review. I would love the opportunity to briefly connect or discuss any upcoming openings.\n\nThank you for your time and consideration.\n\nBest regards,\n\n${uName}\n${uPhone}\n${uLink}${uGithub}${uPortfolio}`;
      sub = `Inquiry regarding Intern/Junior ${roleText} opportunities - ${uName}`;
    } else {
      body = `${salutation}\n\nI hope you are doing well.\n\nI am interested in the ${pTitle} role at your company. I have experience in ${pSkills} and believe my skills align well with the requirements.\n\nPlease find my resume attached for your review. I would appreciate the opportunity to discuss how I can contribute to your team.\n\nThank you for your time and consideration.\n\nBest regards,\n\n${uName}\n${uPhone}\n${uLink}${uGithub}${uPortfolio}`;
      sub = `Application for ${pTitle} - ${uName}`;
    }

    setSubject(sub);
    setEmailBody(body);
  };

  useEffect(() => { compileTemplate(); }, [fields, userProfile, isColdEmail, coldEmailRole]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const email = session?.user?.email;
      if (email) {
        try {
          await localforage.setItem(`automailer_settings_${email}`, settings);
        } catch (err) {
          console.warn("Browser storage access denied:", err);
        }
      }

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save settings");
      }

      setUserProfile({ 
        name: settings.USER_NAME, 
        phone: settings.USER_PHONE, 
        linkedin: settings.USER_LINKEDIN,
        github: settings.USER_GITHUB,
        portfolio: settings.USER_PORTFOLIO,
        skills: settings.USER_SKILLS
      });
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
        setIsFollowUp(false);
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
      if (res.ok) {
        addLog(`Email sent to ${fields.email}!`, "success");
        const newEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          company: fields.company || "Unknown Company",
          jobTitle: fields.jobTitle || "Unknown Role",
          email: fields.email,
          recipientName: fields.recipientName,
          type: isFollowUp ? "Follow Up" : (isColdEmail ? "Cold Email" : "Standard Application")
        };
        const updatedHistory = [newEntry, ...history];
        setHistory(updatedHistory);
        localforage.setItem("automailer_history", updatedHistory).catch(console.warn);
      } else {
        addLog(`Send failed: ${data.error}`, "error");
      }
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
                <button
                  className={`tab ${activeTab === "history" ? "active" : ""}`}
                  onClick={() => setActiveTab("history")}
                >
                  History
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
                    placeholder="hr-email@company.com"
                    value={fields.email}
                    onChange={(e) => setFields({ ...fields, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Job Title (Position)</label>
                  <input
                    type="text"
                    placeholder="Software Engineer"
                    value={fields.jobTitle}
                    onChange={(e) => setFields({ ...fields, jobTitle: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    placeholder="Acme Corp"
                    value={fields.company}
                    onChange={(e) => setFields({ ...fields, company: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Hiring Manager / Team</label>
                  <input
                    type="text"
                    placeholder="Hiring Team / John Doe"
                    value={fields.recipientName}
                    onChange={(e) => setFields({ ...fields, recipientName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Key Technologies / Field</label>
                  <input
                    type="text"
                    placeholder="React, Node.js"
                    value={fields.skills}
                    onChange={(e) => setFields({ ...fields, skills: e.target.value })}
                  />
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem", flexGrow: 1, overflowY: "auto", maxHeight: "60vh", paddingRight: "0.5rem" }}>
                {history.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", marginTop: "2rem" }}>No applications sent yet.</p>
                ) : (
                  history.map((item) => (
                    <div key={item.id} style={{ padding: "1rem", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)", background: "var(--bg-secondary)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{item.company}</span>
                          <span className="badge" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", background: "var(--bg-primary)", borderColor: "var(--glass-border)" }}>{item.type}</span>
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.jobTitle}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.email}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(item.date).toLocaleDateString()}</div>
                      </div>
                      <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem", whiteSpace: "nowrap" }}
                        onClick={() => {
                          setFields({
                            email: item.email,
                            company: item.company,
                            jobTitle: item.jobTitle,
                            recipientName: item.recipientName,
                            skills: ""
                          });
                          setIsColdEmail(false);
                          setIsFollowUp(true);
                          setActiveTab("preview");
                        }}
                      >
                        Follow Up
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab content: Email Preview */}
            {activeTab === "preview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem", flexGrow: 1 }}>
                
                {isFollowUp && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.05)", padding: "0.75rem", borderRadius: "var(--radius-md)", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 500 }}>Generating Follow-Up Email</span>
                    <button className="btn btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} onClick={() => setIsFollowUp(false)}>Cancel Follow-Up</button>
                  </div>
                )}
                
                {!isFollowUp && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "-0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <div style={{
                      width: "36px", height: "20px", borderRadius: "20px", background: isColdEmail ? "var(--accent-cyan)" : "var(--glass-border)",
                      position: "relative", transition: "background 0.3s ease"
                    }}>
                      <div style={{
                        width: "16px", height: "16px", borderRadius: "50%", background: "#fff",
                        position: "absolute", top: "2px", left: isColdEmail ? "18px" : "2px", transition: "left 0.3s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
                      }} />
                    </div>
                    <input 
                      type="checkbox" 
                      checked={isColdEmail} 
                      onChange={(e) => setIsColdEmail(e.target.checked)} 
                      style={{ display: "none" }}
                    />
                    Cold Email
                  </label>
                </div>
                )}

                {isColdEmail && (
                  <div className="form-group">
                    <label>Tailor Template</label>
                    <select
                      style={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "var(--radius-md)",
                        padding: "0.5rem",
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.9rem",
                        outline: "none",
                        cursor: "pointer"
                      }}
                      value={coldEmailRole}
                      onChange={(e) => setColdEmailRole(e.target.value)}
                    >
                      <option value="General">General</option>
                      <option value="Frontend">Frontend Development</option>
                      <option value="Backend">Backend Development</option>
                      <option value="Full Stack">Full Stack Development</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>To</label>
                  <input
                    type="email"
                    placeholder="hr-email@company.com"
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
                      <span style={{color: "var(--text-primary)"}}>{resumeExists ? "resume.pdf" : "None"}</span>
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
                background: "var(--bg-secondary)",
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

          <div className="form-group">
            <label>GitHub Profile URL (Optional)</label>
            <input
              type="text"
              placeholder="github.com/username"
              value={settings.USER_GITHUB}
              onChange={(e) => setSettings({ ...settings, USER_GITHUB: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Portfolio Website (Optional)</label>
            <input
              type="text"
              placeholder="yourportfolio.com"
              value={settings.USER_PORTFOLIO}
              onChange={(e) => setSettings({ ...settings, USER_PORTFOLIO: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Technical Skills (Comma separated, Optional)</label>
            <textarea
              placeholder="e.g., React, Next.js, Node.js, Python"
              value={settings.USER_SKILLS}
              onChange={(e) => setSettings({ ...settings, USER_SKILLS: e.target.value })}
              style={{ minHeight: "60px", fontFamily: "inherit" }}
            />
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Used as a default in templates if no specific skills are extracted from the job description.
            </small>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }} disabled={isSavingSettings}>
            {isSavingSettings ? "Saving Settings..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
