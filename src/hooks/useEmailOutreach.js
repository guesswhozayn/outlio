import { useState, useMemo, useEffect } from "react";
import localforage from "localforage";
import { textToHtml } from "@/lib/emailFormatter";
import { validateSettings } from "./useSettings";

const fileToBase64 = async (fileOrBlob) => {
  if (!fileOrBlob) return null;
  if (typeof fileOrBlob === "string") {
    return fileOrBlob.includes(",") ? fileOrBlob.split(",")[1] : fileOrBlob;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result;
      resolve(typeof res === "string" && res.includes(",") ? res.split(",")[1] : res);
    };
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob instanceof Blob ? fileOrBlob : new Blob([fileOrBlob]));
  });
};

export function useEmailOutreach({
  settings,
  fields,
  clearFields,
  resumeExists,
  resumeFile,
  compileBaseFromLatex,
  resetTailoredToDefault,
  setSettingsOpen,
  addLog,
}) {
  const [history, setHistory] = useState([]);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [manualSubject, setManualSubject] = useState(null);
  const [manualEmailBody, setManualEmailBody] = useState(null);
  const [manualEmailHtml, setManualEmailHtml] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const hasGmailConfig = Boolean(settings.GMAIL_USER && settings.GMAIL_APP_PASSWORD);

  useEffect(() => {
    localforage.getItem("outlio_history").then((stored) => {
      if (stored) setHistory(stored);
    }).catch((err) => console.warn("Storage denied for history:", err));
  }, []);

  const compiled = useMemo(() => {
    const pTitle = fields.jobTitle || "[Position Title]";
    const cName = fields.company || "[Company Name]";
    const uName = settings.USER_NAME || "[Your Name]";
    const recName = fields.recipientName || "Hiring Team";

    let salutation = `Hi ${recName},`;
    if (!recName || recName === "Hiring Team" || recName === "Hiring Manager" || recName === "Team") {
      salutation = `Hi ${cName} Hiring Team,`;
    }

    let contactBlock = "";
    if (settings.USER_PORTFOLIO) {
      contactBlock += `\nPortfolio: ${settings.USER_PORTFOLIO}`;
    }
    if (settings.USER_GITHUB) {
      contactBlock += `\nGitHub: ${settings.USER_GITHUB}`;
    }
    if (settings.USER_LINKEDIN) {
      contactBlock += `\nLinkedIn: ${settings.USER_LINKEDIN}`;
    }
    if (settings.USER_PHONE) {
      contactBlock += `\nPhone: ${settings.USER_PHONE}`;
    }

    let body = "";
    let sub = "";

    if (isFollowUp) {
      body = `${salutation}\n\nFollowing up on my application for the ${pTitle} role at ${cName}.\n\nMy resume is re-attached for your convenience. Please let me know if you'd be open to a brief conversation.\n\nBest,\n\n${uName}${contactBlock}`;
      sub = `Following up: ${pTitle} – ${uName}`;
    } else {
      body = `${salutation}\n\nI noticed the ${pTitle} role at ${cName} and would love to apply.\n\nMy resume is attached for your review. Please let me know if you'd be open to a quick chat.\n\nBest,\n\n${uName}${contactBlock}`;
      sub = `Application for ${pTitle} – ${uName}`;
    }

    return { subject: sub, body };
  }, [fields, isFollowUp, settings]);

  const subject = manualSubject !== null ? manualSubject : compiled.subject;
  const emailBody = manualEmailBody !== null ? manualEmailBody : compiled.body;
  const emailHtml = manualEmailHtml !== null ? manualEmailHtml : textToHtml(emailBody);

  const isManuallyEdited = manualSubject !== null || manualEmailBody !== null;

  const handleSetIsManuallyEdited = (val) => {
    if (!val) {
      setManualSubject(null);
      setManualEmailBody(null);
      setManualEmailHtml(null);
    }
  };

  const handleSendEmail = async () => {
    const { isValid, missing } = validateSettings(settings);
    if (!isValid) {
      addLog(`Please complete your settings first. Missing: ${missing.join(", ")}`, "error");
      if (setSettingsOpen) setSettingsOpen(true);
      return;
    }

    if (!fields.email) {
      addLog("Please specify a recipient email address.", "error");
      return;
    }

    setIsSending(true);
    addLog("Sending application via Gmail...", "info");

    try {
      const getCleanFileName = (file) => {
        const uName = (settings.USER_NAME || "user").trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_");
        const fallbackName = `${uName}_resume.pdf`;
        if (!file) return fallbackName;
        const rawName = file.name || fallbackName;
        const baseName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
        return baseName.toLowerCase().endsWith(".pdf") ? baseName : `${baseName}.pdf`;
      };

      let resumeBase64 = null;
      let resumeFileName = getCleanFileName(resumeFile);

      if (resumeFile) {
        resumeBase64 = await fileToBase64(resumeFile);
      } else if (resumeExists) {
        let cachedResume = await localforage.getItem("outlio_tailored_resume");
        if (!cachedResume) {
          cachedResume = await localforage.getItem("outlio_base_resume");
        }
        if (cachedResume) {
          resumeBase64 = await fileToBase64(cachedResume);
          resumeFileName = getCleanFileName(cachedResume);
        }
      }

      if (!resumeBase64 && settings.LATEX_RESUME?.trim() && compileBaseFromLatex) {
        addLog("Compiling base resume PDF before dispatching...", "info");
        const freshBlob = await compileBaseFromLatex(settings.LATEX_RESUME);
        if (freshBlob) {
          resumeBase64 = await fileToBase64(freshBlob);
          resumeFileName = getCleanFileName(freshBlob);
        }
      }

      if (resumeExists && !resumeBase64) {
        throw new Error("Resume attachment is missing. Please save your LaTeX template in settings.");
      }

      const payload = {
        toEmail: fields.email,
        subject,
        emailBody,
        emailHtml,
        userName: settings.USER_NAME || "",
        gmailUser: settings.GMAIL_USER,
        gmailAppPassword: settings.GMAIL_APP_PASSWORD,
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
          type: isFollowUp ? "Follow Up" : "Standard Application",
        };
        const updatedHistory = [newEntry, ...history];
        setHistory(updatedHistory);
        localforage.setItem("outlio_history", updatedHistory).catch(console.warn);

        await resetTailoredToDefault();
        clearFields();
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

  const setSubject = setManualSubject;
  const setEmailBody = setManualEmailBody;
  const setEmailHtml = setManualEmailHtml;

  return {
    history,
    setHistory,
    isFollowUp,
    setIsFollowUp,
    subject,
    setSubject,
    emailBody,
    setEmailBody,
    emailHtml,
    setEmailHtml,
    isManuallyEdited,
    setIsManuallyEdited: handleSetIsManuallyEdited,
    isSending,
    hasGmailConfig,
    handleSendEmail,
  };
}
