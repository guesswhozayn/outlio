import { useState, useEffect, useRef, useCallback, useMemo, useSyncExternalStore } from "react";
import localforage from "localforage";
import { useSession } from "next-auth/react";

const emptySubscribe = () => () => {};

const fileToBase64 = async (fileOrBlob) => {
  if (!fileOrBlob) return null;
  if (typeof fileOrBlob === "string") {
    return fileOrBlob.includes(",") ? fileOrBlob.split(",")[1] : fileOrBlob;
  }
  if (fileOrBlob instanceof ArrayBuffer) {
    const uint8 = new Uint8Array(fileOrBlob);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, uint8.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }
  if (typeof fileOrBlob.arrayBuffer === "function") {
    const buffer = await fileOrBlob.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, uint8.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }
  return null;
};

export function useAutoMailer() {
  const { data: session, status } = useSession();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [postText, setPostText] = useState("");
  const [fields, setFields] = useState({
    email: "", company: "", jobTitle: "", recipientName: "Hiring Team", skills: "", comprehensiveSkills: "", keyRequirements: [],
  });

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
    let textToParse = typeof overrideText === "string" ? overrideText : postText;
    if (!textToParse.trim() && !screenshotData) return;
    setIsParsing(true);

    // If input contains a LinkedIn URL and is relatively short, auto-resolve full details first
    if (/https?:\/\/(?:[a-zA-Z0-9-]+\.)?linkedin\.com\/[^\s]+/i.test(textToParse) && textToParse.length < 600) {
      addLog("Resolving LinkedIn link details...", "info");
      try {
        const fetchRes = await fetch("/api/fetch-linkedin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToParse }),
        });
        if (fetchRes.ok) {
          const fetchData = await fetchRes.json();
          if (fetchData.text && fetchData.text.length > textToParse.length) {
            textToParse = fetchData.text;
            setPostText(textToParse);
            setIsSharedFromLinkedIn(true);
            addLog("Loaded full post details from LinkedIn!", "success");
          }
        }
      } catch (err) {
        console.warn("Auto-resolve error:", err);
      }
    }

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
      fetchAvailableModels();
      
      try {
        const storedHistory = (await localforage.getItem("outlio_history")) || (await localforage.getItem("automailer_history"));
        if (storedHistory) setHistory(storedHistory);
      } catch (err) {
        console.warn("Browser storage access denied for history:", err);
      }

      try {
        const tailoredResume = await localforage.getItem("outlio_tailored_resume");
        const baseResume = (await localforage.getItem("outlio_base_resume")) || (await localforage.getItem("automailer_base_resume"));
        
        const isValidResume = (item) => Boolean(item && (item instanceof Blob || item instanceof ArrayBuffer || (typeof item === 'object' && (item.size > 0 || item.byteLength > 0))));

        if (isValidResume(tailoredResume)) {
          setResumeFile(tailoredResume);
          setResumeExists(true);
          addLog("Tailored resume loaded from browser storage.", "success");
        } else if (isValidResume(baseResume)) {
          setResumeFile(baseResume);
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

    const uName = settings.USER_NAME || "[Your Name]";
    const uPhone = settings.USER_PHONE || "";
    const uLink = settings.USER_LINKEDIN || "";
    
    let salutation = "Hi Hiring Team,";
    if (fields.recipientName && fields.recipientName.toLowerCase() !== "hiring team") {
      salutation = `Hi ${fields.recipientName},`;
    }

    const contactParts = [];
    if (uPhone && uPhone !== "[Phone Number]") contactParts.push(uPhone);
    if (uLink && uLink !== "[LinkedIn Profile]") contactParts.push(uLink);
    if (settings.USER_GITHUB) contactParts.push(settings.USER_GITHUB);
    if (settings.USER_PORTFOLIO) contactParts.push(settings.USER_PORTFOLIO);
    const contactBlock = contactParts.length > 0 ? `\n${contactParts.join(" | ")}` : "";

    const reqs = Array.isArray(fields.keyRequirements) && fields.keyRequirements.length > 0
      ? fields.keyRequirements.slice(0, 3)
      : [];

    let body = "";
    let sub = "";

    if (isFollowUp) {
      const followUpSkills = pSkills && pSkills !== "[your field/technology/domain]" ? pSkills : "this space";
      body = `${salutation}\n\nQuick follow-up on my application for the ${pTitle} role at ${cName}. I remain genuinely enthusiastic about what your team is building and eager to contribute my background in ${followUpSkills}.\n\nI've re-attached my resume for convenience. Would you be open to a brief 10-minute intro chat this week?\n\nBest,\n\n${uName}${contactBlock}`;
      sub = `Following up: ${pTitle} – ${uName}`;
    } else {
      const standardSkills = pSkills && pSkills !== "[your field/technology/domain]" ? pSkills : "modern tech stacks";
      let reqSection = "";
      if (reqs.length > 0) {
        reqSection = `\n\nWhere I can hit the ground running:\n` + reqs.map(r => `• ${r.replace(/^[•\-\*]\s*/, '')}`).join("\n");
      } else if (fields.comprehensiveSkills) {
        reqSection = `\n\nCore toolkit: ${fields.comprehensiveSkills}.`;
      }

      body = `${salutation}\n\nI noticed the ${pTitle} role at ${cName} and wanted to put forward my application. With hands-on expertise in ${standardSkills}, I specialize in turning complex requirements into clean, scalable software.${reqSection}\n\nResume attached. Do you have 10 minutes this week for a brief conversation to see if we're a great mutual fit?\n\nBest,\n\n${uName}${contactBlock}`;
      sub = `Application: ${pTitle} – ${uName}`;
    }

    return { subject: sub, body };
  }, [fields, settings, isFollowUp]);

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
    } catch {
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

    try {
      let resumeBase64 = null;
      let resumeFileName = null;

      if (resumeFile) {
        resumeBase64 = await fileToBase64(resumeFile);
        const defaultFileName = (settings.USER_NAME || "user")
          .trim()
          .toLowerCase()
          .replace(/[^a-zA-Z0-9_-]/g, "_") + "_resume.pdf";
        const rawName = resumeFile.name || defaultFileName;
        resumeFileName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
        if (!resumeFileName.toLowerCase().endsWith(".pdf")) {
          resumeFileName += ".pdf";
        }
      }

      // Fallback: if resumeFile state was lost or corrupted, attempt recovery from localforage
      if (!resumeBase64 && resumeExists) {
        const stored = (await localforage.getItem("outlio_tailored_resume")) ||
          (await localforage.getItem("outlio_base_resume")) ||
          (await localforage.getItem("automailer_base_resume"));
        if (stored) {
          resumeBase64 = await fileToBase64(stored);
          const defaultFileName = (settings.USER_NAME || "user")
            .trim()
            .toLowerCase()
            .replace(/[^a-zA-Z0-9_-]/g, "_") + "_resume.pdf";
          const rawName = stored.name || defaultFileName;
          resumeFileName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
          if (!resumeFileName.toLowerCase().endsWith(".pdf")) {
            resumeFileName += ".pdf";
          }
        }
      }

      if (resumeExists && !resumeBase64) {
        throw new Error("Resume attachment is missing or unreadable. Please re-upload your resume.");
      }

      const payload = {
        toEmail: fields.email,
        subject,
        emailBody,
        gmailUser: settings.GMAIL_USER || session?.user?.email || "",
        gmailAppPassword: settings.GMAIL_APP_PASSWORD || "",
        userName: settings.USER_NAME || "",
        resumeBase64,
        resumeFileName,
      };

      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
          userPhone: settings.USER_PHONE || "",
          userLinkedin: settings.USER_LINKEDIN || "",
          type: isFollowUp ? "Follow Up" : "Standard Application"
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
    subject, setSubject,
    emailBody, setEmailBody,
    isManuallyEdited, setIsManuallyEdited: handleSetIsManuallyEdited,
    settings, setSettings,
    activeTab, setActiveTab,
    history, setHistory,
    isFollowUp, setIsFollowUp,
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
