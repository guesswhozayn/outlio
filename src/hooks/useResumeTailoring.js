import { useState, useRef, useEffect, useCallback } from "react";
import localforage from "localforage";
import { signIn } from "next-auth/react";

export function useResumeTailoring({
  session,
  status,
  settings,
  fields,
  postText,
  setSettingsOpen,
  addLog,
}) {
  const [resumeExists, setResumeExists] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const tailoredResume = await localforage.getItem("outlio_tailored_resume");
        const baseResume = await localforage.getItem("outlio_base_resume");
        const isValidResume = (item) => Boolean(item && (item instanceof Blob || item instanceof ArrayBuffer || (typeof item === "object" && (item.size > 0 || item.byteLength > 0))));

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
    })();
  }, [status, addLog]);

  const handleUploadClick = () => {
    if (status === "unauthenticated") {
      signIn("google");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
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

  const handleTailorResume = async () => {
    if (status === "unauthenticated") {
      signIn("google");
      return;
    }
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
        ["{{USER_EMAIL}}", session?.user?.email || ""],
        ["{{USER_LINKEDIN}}", settings.USER_LINKEDIN || ""],
        ["{{USER_GITHUB}}", settings.USER_GITHUB || ""],
        ["{{USER_PORTFOLIO}}", settings.USER_PORTFOLIO || ""],
      ];

      replacements.forEach(([key, value]) => {
        tailoredLatexTemplate = replaceLatexValue(tailoredLatexTemplate, key, value);
      });

      const tailorRes = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latexCode: tailoredLatexTemplate,
          jobDescription: postText || fields.comprehensiveSkills || fields.skills || "Software Engineering Role",
          model: settings.MODEL || "gemini-3.8-flash",
          apiKey: settings.GEMINI_API_KEY,
        }),
      });
      const tailorData = await tailorRes.json();
      if (!tailorRes.ok) throw new Error(tailorData.error || "Failed to tailor resume");

      addLog("Compiling LaTeX to PDF...", "info");

      const compileRes = await fetch("/api/latex", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latexCode: tailorData.latex, userName: settings.USER_NAME }),
      });

      if (!compileRes.ok) {
        const errorData = await compileRes.json();
        throw new Error(errorData.error || "Failed to compile PDF");
      }

      const pdfBlob = await compileRes.blob();
      const defaultFileName = (settings.USER_NAME || "user").trim().toLowerCase().replace(/\s+/g, "_") + "_resume.pdf";
      pdfBlob.name = defaultFileName;

      await localforage.setItem("outlio_tailored_resume", pdfBlob);
      setResumeFile(pdfBlob);
      setResumeExists(true);
      addLog("Tailored resume generated and attached successfully!", "success");
    } catch (error) {
      addLog(`Error tailoring resume: ${error.message}`, "error");
      if (error.message?.includes("Gemini API key")) {
        setSettingsOpen(true);
      }
    } finally {
      setIsTailoring(false);
    }
  };

  const resetTailoredToDefault = useCallback(async () => {
    localforage.removeItem("outlio_tailored_resume").catch(console.warn);
    const baseResume = await localforage.getItem("outlio_base_resume");
    if (baseResume) {
      setResumeFile(baseResume);
      setResumeExists(true);
    } else {
      setResumeFile(null);
      setResumeExists(false);
    }
  }, []);

  return {
    resumeExists,
    setResumeExists,
    resumeFile,
    setResumeFile,
    isUploading,
    isTailoring,
    fileInputRef,
    handleUploadClick,
    handleFileChange,
    handleTailorResume,
    resetTailoredToDefault,
  };
}
