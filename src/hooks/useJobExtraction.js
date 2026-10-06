import { useState, useRef, useCallback } from "react";
import { signIn } from "next-auth/react";

export function useJobExtraction({
  status,
  settingsRef,
  setSettingsOpen,
  setActiveTab,
  setViewMode,
  setIsManuallyEdited,
  setIsFollowUp,
  addLog,
}) {
  const [postText, setPostText] = useState("");
  const [fields, setFields] = useState({
    email: "",
    company: "",
    jobTitle: "",
    recipientName: "Hiring Team",
    skills: "",
    comprehensiveSkills: "",
    keyRequirements: [],
  });
  const [isParsing, setIsParsing] = useState(false);
  const [screenshotData, setScreenshotData] = useState(null);
  const [screenshotName, setScreenshotName] = useState("");
  const imageInputRef = useRef(null);

  const handleImageUploadClick = () => {
    if (status === "unauthenticated") {
      signIn("google");
      return;
    }
    imageInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setScreenshotName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleParsePost = useCallback(async (overrideText, overrideModel) => {
    if (status === "unauthenticated") {
      signIn("google");
      return;
    }
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
          mimeType,
          model: overrideModel || settingsRef.current.MODEL || "gemini-3.8-flash",
          apiKey: settingsRef.current.GEMINI_API_KEY,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse post");

      setFields({
        email: data.email || "",
        company: data.company || "",
        jobTitle: data.jobTitle || "",
        recipientName: data.recipientName || "Hiring Team",
        skills: data.skills || "",
        comprehensiveSkills: data.comprehensiveSkills || "",
        keyRequirements: Array.isArray(data.keyRequirements) ? data.keyRequirements : [],
      });

      setIsManuallyEdited(false);
      setIsFollowUp(false);
      setActiveTab("preview");
      setViewMode("workspace");
      addLog("Job details extracted successfully!", "success");
    } catch (error) {
      addLog(`Error parsing post: ${error.message}`, "error");
      if (error.message?.includes("Gemini API key")) {
        setSettingsOpen(true);
      }
    } finally {
      setIsParsing(false);
    }
  }, [postText, screenshotData, addLog, status, settingsRef, setIsManuallyEdited, setIsFollowUp, setActiveTab, setViewMode, setSettingsOpen]);

  const clearFields = useCallback(() => {
    setPostText("");
    setScreenshotData(null);
    setScreenshotName("");
    setFields({
      email: "",
      company: "",
      jobTitle: "",
      recipientName: "Hiring Team",
      skills: "",
      comprehensiveSkills: "",
      keyRequirements: [],
    });
  }, []);

  return {
    postText,
    setPostText,
    fields,
    setFields,
    isParsing,
    screenshotData,
    setScreenshotData,
    screenshotName,
    setScreenshotName,
    imageInputRef,
    handleImageUploadClick,
    handleImageChange,
    handleParsePost,
    clearFields,
  };
}
