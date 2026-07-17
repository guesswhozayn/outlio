"use client";

import { useState, useEffect, useRef } from "react";
import localforage from "localforage";
import { useSession, signIn } from "next-auth/react";
import { useTheme } from "next-themes";
import Navbar from "@/components/Navbar";
import JobInput from "@/components/JobInput";
import SettingsDrawer from "@/components/SettingsDrawer";
import ExtractedFieldsTab from "@/components/ExtractedFieldsTab";
import HistoryTab from "@/components/HistoryTab";
import EmailPreviewTab from "@/components/EmailPreviewTab";

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
    USER_NAME: "", USER_PHONE: "", USER_LINKEDIN: "", USER_GITHUB: "", USER_PORTFOLIO: "", LATEX_RESUME: "",
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
  const [isTailoring, setIsTailoring] = useState(false);
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
        portfolio: finalSettings.USER_PORTFOLIO || ""
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
    
    const pSkills = fields.skills || "[your field/technology/domain]";

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
      body = `${salutation}\n\nI'm writing to follow up on my application for the ${pTitle} role${fields.company ? ` at ${fields.company}` : ''}. I remain very interested in the opportunity to join your team and would love to know if there are any updates regarding the hiring process.\n\nPlease let me know if you need any additional information or work samples from my end. I've re-attached my resume for your convenience.\n\nThank you again for your time and consideration.\n\nBest regards,\n\n${uName}\n${uPhone}\n${uLink}${uGithub}${uPortfolio}`;
      sub = `Following up - Application for ${pTitle} - ${uName}`;
    } else if (isColdEmail) {
      let roleText = pTitle;
      let contributionText = "contribute to your team and learn from your experts";
      
      let coldEmailSkills = pSkills;

      if (coldEmailRole === "Frontend") {
         roleText = "Frontend Developer";
         contributionText = "help build engaging, responsive user interfaces and learn from your engineering team";
         coldEmailSkills = "JavaScript, TypeScript, React, Next.js, and TailwindCSS";
      } else if (coldEmailRole === "Backend") {
         roleText = "Backend Developer";
         contributionText = "help build scalable, robust server-side architecture and learn from your engineering team";
         coldEmailSkills = "Node.js, Python, SQL, REST/GraphQL APIs, PostgreSQL, MongoDB, and Docker";
      } else if (coldEmailRole === "Full Stack") {
         roleText = "Full Stack Developer";
         contributionText = "contribute across the stack to deliver end-to-end features and learn from your engineering team";
         coldEmailSkills = "TypeScript, React, Next.js, Node.js, PostgreSQL, MongoDB, and Docker";
      } else if (coldEmailRole === "Software Engineer") {
         roleText = "Software Engineer";
         contributionText = "help build robust, scalable applications and solve complex problems with your engineering team";
         coldEmailSkills = "JavaScript, TypeScript, Python, C++, SQL, Node.js, and Docker";
      }

      const cName = fields.company ? fields.company : "your company";

      body = `${salutation}\n\nI am writing to express my interest in any potential intern or junior ${roleText} roles at ${cName}. With my background in ${coldEmailSkills}, I am eager to ${contributionText}.\n\nI have attached my resume for your review. I would love the opportunity to briefly connect or discuss any upcoming openings.\n\nThank you for your time and consideration.\n\nBest regards,\n\n${uName}\n${uPhone}\n${uLink}${uGithub}${uPortfolio}`;
      sub = `Application for Intern/Junior ${roleText} - ${uName}`;
    } else {
      const cName = fields.company ? fields.company : "your company";
      body = `${salutation}\n\nI am interested in the ${pTitle} role at ${cName}. I have experience in ${pSkills} and believe my skills align well with the requirements.\n\nPlease find my resume attached for your review. I would appreciate the opportunity to discuss how I can contribute to your team.\n\nThank you for your time and consideration.\n\nBest regards,\n\n${uName}\n${uPhone}\n${uLink}${uGithub}${uPortfolio}`;
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
        portfolio: settings.USER_PORTFOLIO
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

  const handleTailorResume = async () => {
    if (!settings.LATEX_RESUME) {
      addLog("Please provide a base LaTeX resume in settings first.", "error");
      return;
    }
    
    setIsTailoring(true);
    addLog("Tailoring resume with Gemini...", "info");
    
    try {
      let tailoredLatexTemplate = settings.LATEX_RESUME;
      const replacements = {
        "\\{\\{USER_NAME\\}\\}": settings.USER_NAME || "",
        "\\{\\{USER_PHONE\\}\\}": settings.USER_PHONE || "",
        "\\{\\{USER_EMAIL\\}\\}": settings.GMAIL_USER || session?.user?.email || "",
        "\\{\\{USER_LINKEDIN\\}\\}": settings.USER_LINKEDIN || "",
        "\\{\\{USER_GITHUB\\}\\}": settings.USER_GITHUB || "",
        "\\{\\{USER_PORTFOLIO\\}\\}": settings.USER_PORTFOLIO || ""
      };
      
      Object.entries(replacements).forEach(([key, value]) => {
        tailoredLatexTemplate = tailoredLatexTemplate.replace(new RegExp(key, 'g'), value);
      });

      const tailorRes = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          latexCode: tailoredLatexTemplate,
          jobDescription: postText || fields.skills || "Software Engineering Role",
          userApiKey: settings.GEMINI_API_KEY,
          userModel: settings.GEMINI_MODEL
        })
      });
      const tailorData = await tailorRes.json();
      if (!tailorRes.ok) throw new Error(tailorData.error || "Failed to tailor resume");
      
      addLog("Compiling LaTeX to PDF...", "info");
      
      const compileRes = await fetch("/api/compile-latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latexCode: tailorData.latex, userName: settings.USER_NAME })
      });
      
      if (!compileRes.ok) {
        const errorData = await compileRes.json();
        throw new Error(errorData.error || "Failed to compile PDF");
      }
      
      const pdfBlob = await compileRes.blob();
      const defaultFileName = (settings.USER_NAME || "user").trim().toLowerCase().replace(/\s+/g, '_') + "_resume.pdf";
      pdfBlob.name = defaultFileName;
      
      await localforage.setItem("automailer_resume", pdfBlob);
      setResumeFile(pdfBlob);
      setResumeExists(true);
      addLog("Tailored resume generated and attached successfully!", "success");
      
    } catch (error) {
      addLog(`Error tailoring resume: ${error.message}`, "error");
    } finally {
      setIsTailoring(false);
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
    formData.append("userName", settings.USER_NAME || "");
    const defaultFileName = (settings.USER_NAME || "user").trim().toLowerCase().replace(/\s+/g, '_') + "_resume.pdf";
    formData.append("resume", resumeFile, resumeFile.name || defaultFileName);

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

        // Cleanup after successful send
        setResumeFile(null);
        setResumeExists(false);
        localforage.removeItem("automailer_resume").catch(console.warn);
        setPostText("");
        setScreenshotData(null);
        setScreenshotName("");
        setFields({ email: "", company: "", jobTitle: "", recipientName: "Hiring Team", skills: "" });
        addLog("Form and attachments cleared for next application.", "info");
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
      <Navbar
        mounted={mounted}
        theme={theme}
        setTheme={setTheme}
        setSettingsOpen={setSettingsOpen}
      />

      <div className="dashboard-grid">
        <JobInput
          postText={postText}
          setPostText={setPostText}
          logs={logs}
          handleImageUploadClick={handleImageUploadClick}
          imageInputRef={imageInputRef}
          handleImageChange={handleImageChange}
          screenshotName={screenshotName}
          setScreenshotData={setScreenshotData}
          setScreenshotName={setScreenshotName}
          isParsing={isParsing}
          screenshotData={screenshotData}
          handleParsePost={handleParsePost}
        />

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

            {activeTab === "details" && (
              <ExtractedFieldsTab fields={fields} setFields={setFields} />
            )}

            {activeTab === "history" && (
              <HistoryTab
                history={history}
                setFields={setFields}
                setIsColdEmail={setIsColdEmail}
                setIsFollowUp={setIsFollowUp}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "preview" && (
              <EmailPreviewTab
                isFollowUp={isFollowUp}
                setIsFollowUp={setIsFollowUp}
                isColdEmail={isColdEmail}
                setIsColdEmail={setIsColdEmail}
                coldEmailRole={coldEmailRole}
                setColdEmailRole={setColdEmailRole}
                fields={fields}
                setFields={setFields}
                subject={subject}
                setSubject={setSubject}
                emailBody={emailBody}
                setEmailBody={setEmailBody}
                resumeExists={resumeExists}
                resumeFile={resumeFile}
                settings={settings}
                handleTailorResume={handleTailorResume}
                isTailoring={isTailoring}
                handleUploadClick={handleUploadClick}
                isUploading={isUploading}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                isSending={isSending}
                hasGmailConfig={hasGmailConfig}
                handleSendEmail={handleSendEmail}
              />
            )}
          </div>
        </div>
      </div>

      <SettingsDrawer
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        settings={settings}
        setSettings={setSettings}
        hasGeminiKey={hasGeminiKey}
        isFetchingModels={isFetchingModels}
        availableModels={availableModels}
        hasGmailConfig={hasGmailConfig}
        isSavingSettings={isSavingSettings}
        handleSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
