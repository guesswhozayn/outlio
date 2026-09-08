import { useState, useEffect, useRef } from "react";
import localforage from "localforage";
import { useSession } from "next-auth/react";

export function useAutoMailer() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [postText, setPostText] = useState("");
  const [fields, setFields] = useState({
    email: "", company: "", jobTitle: "", recipientName: "Hiring Team", skills: "", comprehensiveSkills: "", keyRequirements: [],
  });
  const [userProfile, setUserProfile] = useState({ name: "", phone: "", linkedin: "", github: "", portfolio: "" });
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);

  const [settings, setSettings] = useState({
    MODEL: "openrouter/free",
    GMAIL_USER: "", GMAIL_APP_PASSWORD: "",
    USER_NAME: "", USER_PHONE: "", USER_LINKEDIN: "", USER_GITHUB: "", USER_PORTFOLIO: "", LATEX_RESUME: "",
  });

  const [activeTab, setActiveTab] = useState("preview");
  const [history, setHistory] = useState([]);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [isColdEmail, setIsColdEmail] = useState(false);
  const [coldEmailRole, setColdEmailRole] = useState("General");
  const [settingsOpen, setSettingsOpen] = useState(false);
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

      // Migrate from old GEMINI_MODEL if present
      const savedModel = finalSettings.MODEL || (finalSettings.GEMINI_MODEL && !finalSettings.GEMINI_MODEL.includes("gemini") ? finalSettings.GEMINI_MODEL : "openrouter/free");
      finalSettings.MODEL = savedModel;

      setSettings(prev => ({ ...prev, ...finalSettings }));
      setUserProfile({ 
        name: finalSettings.USER_NAME || "", 
        phone: finalSettings.USER_PHONE || "", 
        linkedin: finalSettings.USER_LINKEDIN || "",
        github: finalSettings.USER_GITHUB || "",
        portfolio: finalSettings.USER_PORTFOLIO || ""
      });
      setHasGmailConfig(!!finalSettings.GMAIL_USER && !!finalSettings.GMAIL_APP_PASSWORD);
      fetchAvailableModels();
      
      try {
        const storedHistory = await localforage.getItem("automailer_history");
        if (storedHistory) setHistory(storedHistory);
      } catch (err) {
        console.warn("Browser storage access denied for history:", err);
      }

      try {
        const storedResume = await localforage.getItem("automailer_base_resume");
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

  const fetchAvailableModels = async () => {
    setIsFetchingModels(true);
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (res.ok) setAvailableModels(data.models || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetchingModels(false);
    }
  };

  useEffect(() => {
    if (settingsOpen && availableModels.length === 0) fetchAvailableModels();
  }, [settingsOpen]);

  const compileTemplate = () => {
    if (isManuallyEdited) return;

    const pTitle = fields.jobTitle || "[Position Title]";
    const pSkills = fields.skills || "[your field/technology/domain]";
    const cName = fields.company ? fields.company : "your company";

    const uName = userProfile.name || "[Your Name]";
    const uPhone = fields.userPhone || userProfile.phone || "[Phone Number]";
    const uLink = fields.userLinkedin || userProfile.linkedin || "[LinkedIn Profile]";
    const uGithub = userProfile.github ? `\n${userProfile.github}` : "";
    const uPortfolio = userProfile.portfolio ? `\n${userProfile.portfolio}` : "";
    
    let salutation = "Dear Hiring Team,";
    if (fields.recipientName && fields.recipientName.toLowerCase() !== "hiring team") {
      salutation = `Dear ${fields.recipientName},`;
    }

    const reqs = Array.isArray(fields.keyRequirements) && fields.keyRequirements.length > 0
      ? fields.keyRequirements
      : (typeof fields.keyRequirements === 'string' && fields.keyRequirements.trim() 
          ? fields.keyRequirements.split('\n').filter(Boolean) 
          : []);

    let body = "";
    let sub = "";

    if (isFollowUp) {
      body = `${salutation}\n\nI am writing to follow up on my application for the ${pTitle} role at ${cName}. I remain very enthusiastic about joining your team and contributing my expertise in ${pSkills}.\n\nPlease let me know if you need any additional information or work samples from my end. I have re-attached my resume for your convenience.\n\nThank you again for your time and consideration.\n\nBest regards,\n\n${uName}\n${uPhone}\n${uLink}${uGithub}${uPortfolio}`;
      sub = `Following up - Application for ${pTitle} - ${uName}`;
    } else if (isColdEmail) {
      let roleText = pTitle !== "[Position Title]" ? pTitle : "Software Developer";
      let contributionText = "leverage my skills to contribute to your engineering goals";
      let coldEmailSkills = pSkills !== "[your field/technology/domain]" ? pSkills : "relevant technologies";

      if (coldEmailRole === "Frontend") {
         roleText = "Frontend Developer";
         contributionText = "help build engaging, responsive user interfaces and deliver seamless web applications";
         coldEmailSkills = pSkills !== "[your field/technology/domain]" ? pSkills : "JavaScript, TypeScript, React, Next.js, and CSS";
      } else if (coldEmailRole === "Backend") {
         roleText = "Backend Developer";
         contributionText = "help build scalable server-side architecture, APIs, and data pipelines";
         coldEmailSkills = pSkills !== "[your field/technology/domain]" ? pSkills : "Node.js, Python, SQL, REST/GraphQL APIs, and Docker";
      } else if (coldEmailRole === "Full Stack") {
         roleText = "Full Stack Developer";
         contributionText = "contribute across the full stack to build end-to-end features and scalable solutions";
         coldEmailSkills = pSkills !== "[your field/technology/domain]" ? pSkills : "TypeScript, React, Next.js, Node.js, and modern databases";
      } else if (coldEmailRole === "Software Engineer") {
         roleText = "Software Engineer";
         contributionText = "help build robust, scalable applications and solve complex technical problems";
         coldEmailSkills = pSkills !== "[your field/technology/domain]" ? pSkills : "JavaScript, TypeScript, Python, SQL, and cloud platforms";
      }

      let reqSection = "";
      if (reqs.length > 0) {
        reqSection = `\n\nI bring strong hands-on experience in key areas relevant to this role, including:\n` + reqs.map(r => `• ${r.replace(/^[•\-\*]\s*/, '')}`).join("\n");
      }

      body = `${salutation}\n\nI am writing to express my strong interest in potential ${roleText} roles at ${cName}. With my background in ${coldEmailSkills}, I am eager to ${contributionText}.${reqSection}\n\nI have attached my resume for your review. I would love the opportunity to briefly connect to discuss any current or upcoming openings.\n\nThank you for your time and consideration.\n\nBest regards,\n\n${uName}\n${uPhone}\n${uLink}${uGithub}${uPortfolio}`;
      sub = `Application for ${roleText} Role - ${uName}`;
    } else {
      let reqSection = "";
      if (reqs.length > 0) {
        reqSection = `\n\nMy background directly aligns with the key requirements of this position:\n` + reqs.map(r => `• ${r.replace(/^[•\-\*]\s*/, '')}`).join("\n");
      } else if (fields.comprehensiveSkills) {
        reqSection = `\n\nMy technical expertise spans ${fields.comprehensiveSkills}, matching the core qualifications outlined in your job posting.`;
      }

      body = `${salutation}\n\nI am writing to express my strong interest in the ${pTitle} position at ${cName}. Having worked extensively with ${pSkills}, I am confident in my ability to bring immediate value to your team.${reqSection}\n\nI have attached my resume for your review. I would welcome the opportunity to discuss how my background and technical skills align with your team's goals.\n\nThank you for your time and consideration.\n\nBest regards,\n\n${uName}\n${uPhone}\n${uLink}${uGithub}${uPortfolio}`;
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
      await localforage.setItem("automailer_base_resume", file);
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
    addLog("Sending to AI extractor...", "info");
    
    const base64Image = screenshotData ? screenshotData.split(",")[1] : null;
    const mimeType = screenshotData ? screenshotData.split(";")[0].split(":")[1] : null;

    try {
      const res = await fetch("/api/parse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          postText, 
          image: base64Image,
          mimeType,
          model: settings.MODEL || "openrouter/free"
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFields({
          email: data.email || "", company: data.company || "", jobTitle: data.jobTitle || "",
          recipientName: data.recipientName || "Hiring Team", skills: data.skills || "",
          comprehensiveSkills: data.comprehensiveSkills || "",
          keyRequirements: Array.isArray(data.keyRequirements) ? data.keyRequirements : (data.keyRequirements ? [data.keyRequirements] : []),
        });
        setIsFollowUp(false);
        setIsManuallyEdited(false);
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
    addLog("Tailoring resume with AI...", "info");
    
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
          jobDescription: postText || fields.comprehensiveSkills || fields.skills || "Software Engineering Role",
          model: settings.MODEL || "openrouter/free"
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
      
      await localforage.setItem("automailer_tailored_resume", pdfBlob);
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
        localforage.removeItem("automailer_tailored_resume").catch(console.warn);
        const baseResume = await localforage.getItem("automailer_base_resume");
        if (baseResume) {
          setResumeFile(baseResume);
          setResumeExists(true);
        } else {
          setResumeFile(null);
          setResumeExists(false);
        }

        setPostText("");
        setScreenshotData(null);
        setScreenshotName("");
        setFields({ email: "", company: "", jobTitle: "", recipientName: "Hiring Team", skills: "", comprehensiveSkills: "", keyRequirements: [] });
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

  return {
    session, status,
    mounted, setMounted,
    postText, setPostText,
    fields, setFields,
    userProfile, setUserProfile,
    subject, setSubject,
    emailBody, setEmailBody,
    isManuallyEdited, setIsManuallyEdited,
    settings, setSettings,
    activeTab, setActiveTab,
    history, setHistory,
    isFollowUp, setIsFollowUp,
    isColdEmail, setIsColdEmail,
    coldEmailRole, setColdEmailRole,
    settingsOpen, setSettingsOpen,
    hasGmailConfig, setHasGmailConfig,
    resumeExists, setResumeExists,
    resumeFile, setResumeFile,
    isParsing, setIsParsing,
    isSending, setIsSending,
    isUploading, setIsUploading,
    isTailoring, setIsTailoring,
    isSavingSettings, setIsSavingSettings,
    availableModels, setAvailableModels,
    isFetchingModels, setIsFetchingModels,
    logs, setLogs,
    fileInputRef, imageInputRef,
    screenshotData, setScreenshotData,
    screenshotName, setScreenshotName,
    handleImageUploadClick, handleImageChange, handleParsePost,
    handleUploadClick, handleFileChange, handleTailorResume, handleSendEmail,
    handleSaveSettings,
  };
}
