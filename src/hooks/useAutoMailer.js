import { useState, useEffect, useRef, useCallback, useMemo, useSyncExternalStore } from "react";
import localforage from "localforage";
import { useSession } from "next-auth/react";

const emptySubscribe = () => () => {};

export function useAutoMailer() {
  const { data: session, status } = useSession();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [postText, setPostText] = useState("");
  const [fields, setFields] = useState({
    email: "", company: "", jobTitle: "", recipientName: "Hiring Team", skills: "", comprehensiveSkills: "", keyRequirements: [],
  });
  const [userProfile, setUserProfile] = useState({ name: "", phone: "", linkedin: "", github: "", portfolio: "" });
  
  const [manualSubject, setManualSubject] = useState("");
  const [manualEmailBody, setManualEmailBody] = useState("");
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
  const hasGmailConfig = Boolean(session?.user?.email || (settings.GMAIL_USER && settings.GMAIL_APP_PASSWORD));
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
  const [isSharedFromLinkedIn, setIsSharedFromLinkedIn] = useState(false);

  const addLog = useCallback((message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  }, []);

  const fetchAvailableModels = useCallback(async () => {
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
  }, []);

  const handleSetSettingsOpen = useCallback((open) => {
    if (open && availableModels.length === 0) {
      fetchAvailableModels();
    }
    setSettingsOpen(open);
  }, [availableModels.length, fetchAvailableModels]);

  const handleParsePost = useCallback(async (overrideText, overrideModel) => {
    const textToParse = typeof overrideText === "string" ? overrideText : postText;
    if (!textToParse.trim() && !screenshotData) return;
    setIsParsing(true);
    addLog("Sending to AI extractor...", "info");
    
    const base64Image = screenshotData ? screenshotData.split(",")[1] : null;
    const mimeType = screenshotData ? screenshotData.split(";")[0].split(":")[1] : null;

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postText: textToParse,
          image: base64Image,
          mimeType: mimeType,
          model: overrideModel || settings.MODEL || "openrouter/free"
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse post");

      const newFields = {
        email: data.email || "",
        company: data.company || "",
        jobTitle: data.jobTitle || "",
        recipientName: data.recipientName || "Hiring Team",
        skills: data.skills || "",
        comprehensiveSkills: data.comprehensiveSkills || "",
        keyRequirements: Array.isArray(data.keyRequirements) ? data.keyRequirements : []
      };

      setFields(newFields);
      setIsManuallyEdited(false);
      setIsFollowUp(false);
      setIsColdEmail(false);
      setActiveTab("preview");
      addLog("Job details extracted successfully!", "success");

    } catch (error) {
      addLog(`Error parsing post: ${error.message}`, "error");
    } finally {
      setIsParsing(false);
    }
  }, [postText, screenshotData, settings.MODEL, addLog]);

  const checkSharedJob = useCallback(async (currentSettings) => {
    if (typeof window === "undefined") return;
    try {
      const sharedRaw = localStorage.getItem("outlio_shared_job");
      if (!sharedRaw) return;

      const sharedObj = JSON.parse(sharedRaw);
      if (sharedObj && sharedObj.text) {
        setPostText(sharedObj.text);
        setIsSharedFromLinkedIn(true);
        localStorage.removeItem("outlio_shared_job");

        const shouldAutoParse = sessionStorage.getItem("outlio_trigger_auto_parse");
        sessionStorage.removeItem("outlio_trigger_auto_parse");

        if (window.location.search.includes("shared=true")) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }

        addLog("Loaded shared LinkedIn post into workspace.", "success");

        if (shouldAutoParse === "true") {
          addLog("Automatically extracting details from shared post...", "info");
          const activeModel = currentSettings?.MODEL || settings.MODEL || "openrouter/free";
          handleParsePost(sharedObj.text, activeModel);
        }
      }
    } catch (err) {
      console.warn("Error reading shared job from storage:", err);
    }
  }, [handleParsePost, settings.MODEL, addLog]);

  const loadSettings = useCallback(async () => {
    try {
      const email = session?.user?.email;
      let localSettings = {};
      if (email) {
        try {
          localSettings = (await localforage.getItem(`outlio_settings_${email}`)) || (await localforage.getItem(`automailer_settings_${email}`)) || {};
        } catch (err) {
          console.warn("Browser storage access denied:", err);
        }
      }

      const res = await fetch("/api/settings", { cache: "no-store" });
      const parsed = await res.json();
      
      let finalSettings = { ...localSettings };

      if (parsed && Object.keys(parsed).length > 0 && !parsed.error) {
        const hasActualData = Object.values(parsed).some(val => val !== "");
        if (hasActualData) {
          finalSettings = { ...finalSettings, ...parsed };
        }
      }

      if (email && Object.keys(finalSettings).length > 0) {
        try {
          await localforage.setItem(`outlio_settings_${email}`, finalSettings);
        } catch (err) {
          console.warn("Browser storage access denied:", err);
        }
      }

      const savedModel = finalSettings.MODEL || (finalSettings.GEMINI_MODEL && !finalSettings.GEMINI_MODEL.includes("gemini") ? finalSettings.GEMINI_MODEL : "openrouter/free");
      finalSettings.MODEL = savedModel;
      if (!finalSettings.GMAIL_USER && email) {
        finalSettings.GMAIL_USER = email;
      }
      if (!finalSettings.USER_NAME && session?.user?.name) {
        finalSettings.USER_NAME = session.user.name;
      }

      setSettings(prev => ({ ...prev, ...finalSettings }));
      setUserProfile({ 
        name: finalSettings.USER_NAME || "", 
        phone: finalSettings.USER_PHONE || "", 
        linkedin: finalSettings.USER_LINKEDIN || "",
        github: finalSettings.USER_GITHUB || "",
        portfolio: finalSettings.USER_PORTFOLIO || ""
      });
      fetchAvailableModels();
      
      try {
        const storedHistory = (await localforage.getItem("outlio_history")) || (await localforage.getItem("automailer_history"));
        if (storedHistory) setHistory(storedHistory);
      } catch (err) {
        console.warn("Browser storage access denied for history:", err);
      }

      try {
        const storedResume = (await localforage.getItem("outlio_base_resume")) || (await localforage.getItem("automailer_base_resume"));
        if (storedResume) {
          setResumeFile(storedResume);
          setResumeExists(true);
          addLog("Default resume loaded from browser storage.", "success");
        }
      } catch (err) {
        console.warn("Browser storage access denied for resume:", err);
      }

      checkSharedJob(finalSettings);
    } catch (e) {
      console.error(e);
    }
  }, [session, fetchAvailableModels, checkSharedJob, addLog]);

  useEffect(() => {
    if (status === "authenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadSettings();
      addLog("Dashboard initialized. Ready to process jobs.", "info");
      checkSharedJob();
    }
  }, [status, loadSettings, checkSharedJob, addLog]);

  const compiled = useMemo(() => {
    const pTitle = fields.jobTitle || "[Position Title]";
    const pSkills = fields.skills || "";
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
      : [];

    let body = "";
    let sub = "";

    if (isFollowUp) {
      const followUpSkills = pSkills && pSkills !== "[your field/technology/domain]" ? pSkills : "this field";
      body = `${salutation}\n\nI am writing to follow up on my application for the ${pTitle} role at ${cName}. I remain very enthusiastic about joining your team and contributing my expertise in ${followUpSkills}.\n\nPlease let me know if you need any additional information or work samples from my end. I have re-attached my resume for your convenience.\n\nThank you again for your time and consideration.\n\nBest regards,\n\n${uName}\n${uPhone}\n${uLink}${uGithub}${uPortfolio}`;
      sub = `Following up - Application for ${pTitle} - ${uName}`;
    } else if (isColdEmail) {
      let roleText = pTitle !== "[Position Title]" ? pTitle : "Software Developer";
      let contributionText = "leverage my skills to contribute to your engineering goals";
      let coldEmailSkills = pSkills && pSkills !== "[your field/technology/domain]" ? pSkills : "relevant technologies";

      if (coldEmailRole === "Frontend") {
         roleText = "Frontend Developer";
         contributionText = "help build engaging, responsive user interfaces and deliver seamless web applications";
         coldEmailSkills = pSkills && pSkills !== "[your field/technology/domain]" ? pSkills : "JavaScript, TypeScript, React, Next.js, and CSS";
      } else if (coldEmailRole === "Backend") {
         roleText = "Backend Developer";
         contributionText = "help build scalable server-side architecture, APIs, and data pipelines";
         coldEmailSkills = pSkills && pSkills !== "[your field/technology/domain]" ? pSkills : "Node.js, Python, SQL, REST/GraphQL APIs, and Docker";
      } else if (coldEmailRole === "Full Stack") {
         roleText = "Full Stack Developer";
         contributionText = "contribute across the full stack to build end-to-end features and scalable solutions";
         coldEmailSkills = pSkills && pSkills !== "[your field/technology/domain]" ? pSkills : "TypeScript, React, Next.js, Node.js, and modern databases";
      } else if (coldEmailRole === "Software Engineer") {
         roleText = "Software Engineer";
         contributionText = "help build robust, scalable applications and solve complex technical problems";
         coldEmailSkills = pSkills && pSkills !== "[your field/technology/domain]" ? pSkills : "JavaScript, TypeScript, Python, SQL, and cloud platforms";
      }

      let reqSection = "";
      if (reqs.length > 0) {
        reqSection = `\n\nI bring strong hands-on experience in key areas relevant to this role, including:\n` + reqs.map(r => `• ${r.replace(/^[•\-\*]\s*/, '')}`).join("\n");
      }

      body = `${salutation}\n\nI am writing to express my strong interest in potential ${roleText} roles at ${cName}. With my background in ${coldEmailSkills}, I am eager to ${contributionText}.${reqSection}\n\nI have attached my resume for your review. I would love the opportunity to briefly connect to discuss any current or upcoming openings.\n\nThank you for your time and consideration.\n\nBest regards,\n\n${uName}\n${uPhone}\n${uLink}${uGithub}${uPortfolio}`;
      sub = `Application for ${roleText} Role - ${uName}`;
    } else {
      const standardSkills = pSkills && pSkills !== "[your field/technology/domain]" ? pSkills : "relevant technologies";
      let reqSection = "";
      if (reqs.length > 0) {
        reqSection = `\n\nMy background directly aligns with the key requirements of this position:\n` + reqs.map(r => `• ${r.replace(/^[•\-\*]\s*/, '')}`).join("\n");
      } else if (fields.comprehensiveSkills) {
        reqSection = `\n\nMy technical expertise spans ${fields.comprehensiveSkills}, matching the core qualifications outlined in your job posting.`;
      }

      body = `${salutation}\n\nI am writing to express my strong interest in the ${pTitle} position at ${cName}. Having worked extensively with ${standardSkills}, I am confident in my ability to bring immediate value to your team.${reqSection}\n\nI have attached my resume for your review. I would welcome the opportunity to discuss how my background and technical skills align with your team's goals.\n\nThank you for your time and consideration.\n\nBest regards,\n\n${uName}\n${uPhone}\n${uLink}${uGithub}${uPortfolio}`;
      sub = `Application for ${pTitle} - ${uName}`;
    }

    return { subject: sub, body };
  }, [fields, userProfile, isFollowUp, isColdEmail, coldEmailRole]);

  const subject = isManuallyEdited ? manualSubject : compiled.subject;
  const emailBody = isManuallyEdited ? manualEmailBody : compiled.body;

  const setSubject = (val) => {
    setManualSubject(val);
    setIsManuallyEdited(true);
  };
  const setEmailBody = (val) => {
    setManualEmailBody(val);
    setIsManuallyEdited(true);
  };
  const handleSetIsManuallyEdited = (val) => {
    setIsManuallyEdited(val);
    if (!val) {
      setManualSubject("");
      setManualEmailBody("");
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const email = session?.user?.email;
      if (email) {
        try {
          await localforage.setItem(`outlio_settings_${email}`, settings);
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
    e.target.value = "";
    if (file.type !== "application/pdf") {
      addLog("Only PDF files are supported.", "error");
      return;
    }
    setIsUploading(true);
    try {
      await localforage.setItem("outlio_base_resume", file);
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
    e.target.value = "";
    setScreenshotName(file.name);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotData(reader.result);
    };
    reader.readAsDataURL(file);
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
      
      const replaceLatexValue = (template, placeholder, rawValue) => {
        if (!rawValue) return template.replaceAll(placeholder, "");
        return template.replaceAll(placeholder, (match, offset, fullStr) => {
          const before = fullStr.slice(Math.max(0, offset - 40), offset);
          const isInsideHrefUrl = /\\href\{[^{}]*$/.test(before);
          const isInsideUrl = /\\url\{[^{}]*$/.test(before);
          if (isInsideHrefUrl || isInsideUrl) {
            return rawValue;
          }
          return String(rawValue)
            .replace(/\\/g, "\\textbackslash{}")
            .replace(/([&%$#_{}])/g, "\\$1")
            .replace(/~/g, "\\textasciitilde{}")
            .replace(/\^/g, "\\textasciicircum{}");
        });
      };

      const replacements = [
        ["{{USER_NAME}}", settings.USER_NAME || ""],
        ["{{USER_PHONE}}", settings.USER_PHONE || ""],
        ["{{USER_EMAIL}}", settings.GMAIL_USER || session?.user?.email || ""],
        ["{{USER_LINKEDIN}}", settings.USER_LINKEDIN || ""],
        ["{{USER_GITHUB}}", settings.USER_GITHUB || ""],
        ["{{USER_PORTFOLIO}}", settings.USER_PORTFOLIO || ""]
      ];
      
      replacements.forEach(([key, value]) => {
        tailoredLatexTemplate = replaceLatexValue(tailoredLatexTemplate, key, value);
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
      
      await localforage.setItem("outlio_tailored_resume", pdfBlob);
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
    formData.append("gmailUser", settings.GMAIL_USER || session?.user?.email || "");
    formData.append("gmailAppPassword", settings.GMAIL_APP_PASSWORD || "");
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
          skills: fields.skills || "",
          keyRequirements: fields.keyRequirements || [],
          comprehensiveSkills: fields.comprehensiveSkills || "",
          userPhone: fields.userPhone || "",
          userLinkedin: fields.userLinkedin || "",
          type: isFollowUp ? "Follow Up" : (isColdEmail ? "Cold Email" : "Standard Application")
        };
        const updatedHistory = [newEntry, ...history];
        setHistory(updatedHistory);
        localforage.setItem("outlio_history", updatedHistory).catch(console.warn);

        // Cleanup after successful send
        localforage.removeItem("outlio_tailored_resume").catch(console.warn);
        localforage.removeItem("automailer_tailored_resume").catch(console.warn);
        const baseResume = (await localforage.getItem("outlio_base_resume")) || (await localforage.getItem("automailer_base_resume"));
        if (baseResume) {
          setResumeFile(baseResume);
          setResumeExists(true);
        } else {
          setResumeFile(null);
          setResumeExists(false);
        }

        setPostText("");
        setIsSharedFromLinkedIn(false);
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
    mounted,
    postText, setPostText,
    isSharedFromLinkedIn, setIsSharedFromLinkedIn,
    fields, setFields,
    userProfile, setUserProfile,
    subject, setSubject,
    emailBody, setEmailBody,
    isManuallyEdited, setIsManuallyEdited: handleSetIsManuallyEdited,
    settings, setSettings,
    activeTab, setActiveTab,
    history, setHistory,
    isFollowUp, setIsFollowUp,
    isColdEmail, setIsColdEmail,
    coldEmailRole, setColdEmailRole,
    settingsOpen, setSettingsOpen: handleSetSettingsOpen,
    hasGmailConfig,
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

export const useOutlio = useAutoMailer;
