import { useState, useCallback, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import { useSettings } from "./useSettings";
import { useJobExtraction } from "./useJobExtraction";
import { useResumeTailoring } from "./useResumeTailoring";
import { useEmailOutreach } from "./useEmailOutreach";

const emptySubscribe = () => () => {};

export function useOutlio() {
  const { data: session, status } = useSession();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [activeTab, setActiveTab] = useState("preview");
  const [viewMode, setViewMode] = useState("input");
  const [helpOpen, setHelpOpen] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = useCallback((message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, message, type }]);
  }, []);

  const settingsState = useSettings({ session, status, addLog });

  const extractionState = useJobExtraction({
    status,
    settingsRef: settingsState.settingsRef,
    setSettingsOpen: settingsState.setSettingsOpen,
    setActiveTab,
    setViewMode,
    setIsManuallyEdited: (val) => outreachState.setIsManuallyEdited(val),
    setIsFollowUp: (val) => outreachState.setIsFollowUp(val),
    addLog,
  });

  const resumeState = useResumeTailoring({
    session,
    status,
    settings: settingsState.settings,
    fields: extractionState.fields,
    postText: extractionState.postText,
    setSettingsOpen: settingsState.setSettingsOpen,
    addLog,
  });

  const outreachState = useEmailOutreach({
    session,
    status,
    settings: settingsState.settings,
    fields: extractionState.fields,
    clearFields: extractionState.clearFields,
    resumeExists: resumeState.resumeExists,
    resumeFile: resumeState.resumeFile,
    resetTailoredToDefault: resumeState.resetTailoredToDefault,
    addLog,
  });

  return {
    session,
    status,
    mounted,

    // Navigation & UI
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    helpOpen,
    setHelpOpen,
    logs,
    setLogs,

    // Settings
    settings: settingsState.settings,
    setSettings: settingsState.setSettings,
    settingsOpen: settingsState.settingsOpen,
    setSettingsOpen: settingsState.setSettingsOpen,
    isSavingSettings: settingsState.isSavingSettings,
    handleSaveSettings: settingsState.handleSaveSettings,
    availableModels: settingsState.availableModels,
    setAvailableModels: settingsState.setAvailableModels,
    isFetchingModels: settingsState.isFetchingModels,
    fetchAvailableModels: settingsState.fetchAvailableModels,
    syncStatus: settingsState.syncStatus,

    // Job extraction
    postText: extractionState.postText,
    setPostText: extractionState.setPostText,
    fields: extractionState.fields,
    setFields: extractionState.setFields,
    isParsing: extractionState.isParsing,
    setIsParsing: extractionState.setIsParsing,
    screenshotData: extractionState.screenshotData,
    setScreenshotData: extractionState.setScreenshotData,
    screenshotName: extractionState.screenshotName,
    setScreenshotName: extractionState.setScreenshotName,
    imageInputRef: extractionState.imageInputRef,
    handleImageUploadClick: extractionState.handleImageUploadClick,
    handleImageChange: extractionState.handleImageChange,
    handleParsePost: extractionState.handleParsePost,

    // Resume tailoring
    resumeExists: resumeState.resumeExists,
    setResumeExists: resumeState.setResumeExists,
    resumeFile: resumeState.resumeFile,
    setResumeFile: resumeState.setResumeFile,
    isUploading: resumeState.isUploading,
    setIsUploading: resumeState.setIsUploading,
    isTailoring: resumeState.isTailoring,
    setIsTailoring: resumeState.setIsTailoring,
    fileInputRef: resumeState.fileInputRef,
    handleUploadClick: resumeState.handleUploadClick,
    handleFileChange: resumeState.handleFileChange,
    handleTailorResume: resumeState.handleTailorResume,

    // Email outreach
    subject: outreachState.subject,
    setSubject: outreachState.setSubject,
    emailBody: outreachState.emailBody,
    setEmailBody: outreachState.setEmailBody,
    isManuallyEdited: outreachState.isManuallyEdited,
    setIsManuallyEdited: outreachState.setIsManuallyEdited,
    history: outreachState.history,
    setHistory: outreachState.setHistory,
    isFollowUp: outreachState.isFollowUp,
    setIsFollowUp: outreachState.setIsFollowUp,
    hasGmailConfig: outreachState.hasGmailConfig,
    isSending: outreachState.isSending,
    setIsSending: outreachState.setIsSending,
    handleSendEmail: outreachState.handleSendEmail,
  };
}
