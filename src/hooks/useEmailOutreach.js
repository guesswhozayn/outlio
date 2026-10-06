import { useState, useMemo, useEffect } from "react";
import localforage from "localforage";
import { signIn } from "next-auth/react";

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
  session,
  status,
  settings,
  fields,
  clearFields,
  resumeExists,
  resumeFile,
  resetTailoredToDefault,
  addLog,
}) {
  const [history, setHistory] = useState([]);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [manualSubject, setManualSubject] = useState(null);
  const [manualEmailBody, setManualEmailBody] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const hasGmailConfig = Boolean(session?.user?.email);

  useEffect(() => {
    if (status !== "authenticated") return;
    localforage.getItem("outlio_history").then((stored) => {
      if (stored) setHistory(stored);
    }).catch((err) => console.warn("Storage denied for history:", err));
  }, [status]);

  const compiled = useMemo(() => {
    const pTitle = fields.jobTitle || "[Position Title]";
    const cName = fields.company || "your company";
    const uName = settings.USER_NAME || "[Your Name]";
    const uPhone = settings.USER_PHONE || "";
    const uLink = settings.USER_LINKEDIN || "";

    const salutation = fields.recipientName && fields.recipientName.toLowerCase() !== "hiring team"
      ? `Hi ${fields.recipientName},`
      : "Hi Hiring Team,";

    const contactParts = [];
    if (uPhone && uPhone !== "[Phone Number]") contactParts.push(uPhone);
    if (uLink && uLink !== "[LinkedIn Profile]") contactParts.push(uLink);
    if (settings.USER_GITHUB) contactParts.push(settings.USER_GITHUB);
    if (settings.USER_PORTFOLIO) contactParts.push(settings.USER_PORTFOLIO);
    const contactBlock = contactParts.length > 0 ? `\n${contactParts.join(" | ")}` : "";

    if (isFollowUp) {
      return {
        subject: `Following up: ${pTitle} – ${uName}`,
        body: `${salutation}\n\nFollowing up on my application for the ${pTitle} role at ${cName}.\n\nMy resume is re-attached for your convenience. Please let me know if you'd be open to a brief conversation.\n\nBest,\n\n${uName}${contactBlock}`,
      };
    }

    return {
      subject: `Application for ${pTitle} – ${uName}`,
      body: `${salutation}\n\nI noticed the ${pTitle} role at ${cName} and would love to apply.\n\nMy resume is attached for your review. Please let me know if you'd be open to a quick chat.\n\nBest,\n\n${uName}${contactBlock}`,
    };
  }, [fields, settings, isFollowUp]);

  const subject = manualSubject !== null ? manualSubject : compiled.subject;
  const emailBody = manualEmailBody !== null ? manualEmailBody : compiled.body;
  const isManuallyEdited = manualSubject !== null || manualEmailBody !== null;

  const setSubject = (val) => {
    setManualSubject(val);
  };

  const setEmailBody = (val) => {
    setManualEmailBody(val);
  };

  const handleSetIsManuallyEdited = (val) => {
    if (!val) {
      setManualSubject(null);
      setManualEmailBody(null);
    }
  };

  const handleSendEmail = async () => {
    if (status === "unauthenticated") {
      signIn("google");
      return;
    }
    if (!fields.email || !resumeExists || !hasGmailConfig) return;
    setIsSending(true);
    addLog(`Sending application to ${fields.email}...`, "info");

    try {
      let resumeBase64 = null;
      let resumeFileName = null;

      const getCleanFileName = (file) => {
        const fallback = `${(settings.USER_NAME || "user").trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, "_")}_resume.pdf`;
        const name = (file?.name || fallback).replace(/[^a-zA-Z0-9._-]/g, "_");
        return name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
      };

      if (resumeFile) {
        resumeBase64 = await fileToBase64(resumeFile);
        resumeFileName = getCleanFileName(resumeFile);
      }

      if (!resumeBase64 && resumeExists) {
        const stored = (await localforage.getItem("outlio_tailored_resume")) ||
          (await localforage.getItem("outlio_base_resume"));
        if (stored) {
          resumeBase64 = await fileToBase64(stored);
          resumeFileName = getCleanFileName(stored);
        }
      }

      if (resumeExists && !resumeBase64) {
        throw new Error("Resume attachment is missing or unreadable. Please re-upload your resume.");
      }

      const payload = {
        toEmail: fields.email,
        subject,
        emailBody,
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

  return {
    history,
    setHistory,
    isFollowUp,
    setIsFollowUp,
    subject,
    setSubject,
    emailBody,
    setEmailBody,
    isManuallyEdited,
    setIsManuallyEdited: handleSetIsManuallyEdited,
    isSending,
    hasGmailConfig,
    handleSendEmail,
  };
}
