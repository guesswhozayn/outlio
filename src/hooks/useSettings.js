import { useState, useRef, useCallback, useEffect } from "react";
import localforage from "localforage";

export const INITIAL_SETTINGS = {
  MODEL: "openrouter/free",
  GMAIL_USER: "",
  GMAIL_APP_PASSWORD: "",
  USER_NAME: "",
  USER_PHONE: "",
  USER_LINKEDIN: "",
  USER_GITHUB: "",
  USER_PORTFOLIO: "",
  LATEX_RESUME: "",
  EMAIL_FONT_FAMILY: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  EMAIL_FONT_SIZE: "15px",
};

export function validateSettings(s) {
  const missing = [];
  if (!s?.GMAIL_USER?.trim()) missing.push("Gmail Address");
  if (!s?.GMAIL_APP_PASSWORD?.trim()) missing.push("Gmail App Password");
  if (!s?.USER_NAME?.trim()) missing.push("Name");
  if (!s?.USER_PHONE?.trim()) missing.push("Phone");
  if (!s?.USER_LINKEDIN?.trim()) missing.push("LinkedIn");
  if (!s?.LATEX_RESUME?.trim()) missing.push("LaTeX Template");
  return {
    isValid: missing.length === 0,
    missing,
  };
}

export function useSettings({ addLog, onLatexUpdated }) {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isVerifyingGmail, setIsVerifyingGmail] = useState(false);
  const [isFetchingFromCloud, setIsFetchingFromCloud] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ isCloud: false, storageType: "browser" });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const loadSettings = useCallback(async () => {
    try {
      let localSettings = {};
      try {
        localSettings = (await localforage.getItem("outlio_settings")) || {};
      } catch (err) {
        console.warn("Browser storage access denied:", err);
      }
      setSettings({ ...INITIAL_SETTINGS, ...localSettings });
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    addLog("Dashboard initialized. Ready to process jobs.", "info");
  }, [loadSettings, addLog]);

  const handleFetchFromCloud = async () => {
    const gmailUser = settings?.GMAIL_USER?.trim();
    const gmailAppPassword = settings?.GMAIL_APP_PASSWORD?.trim();

    if (!gmailUser || !gmailAppPassword) {
      addLog("Enter your Gmail address and App Password first.", "error");
      return;
    }

    setIsFetchingFromCloud(true);
    addLog("Verifying Gmail credentials...", "info");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fetch",
          gmailUser,
          gmailAppPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      addLog("Gmail credentials verified successfully!", "success");

      if (data.found && data.settings) {
        const merged = {
          ...settings,
          ...data.settings,
          GMAIL_USER: gmailUser,
          GMAIL_APP_PASSWORD: gmailAppPassword,
        };
        setSettings(merged);
        await localforage.setItem("outlio_settings", merged);
        setSyncStatus({ isCloud: true, storageType: "supabase" });
        if (merged.LATEX_RESUME?.trim() && onLatexUpdated) {
          onLatexUpdated(merged.LATEX_RESUME);
        }
        addLog("Loaded existing profile from database.", "success");
      } else {
        addLog("Credentials valid. No existing database profile found—fill in your details and click Save.", "info");
      }
    } catch (err) {
      addLog(`Verification failed: ${err.message}`, "error");
    } finally {
      setIsFetchingFromCloud(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    const { isValid, missing } = validateSettings(settings);
    if (!isValid) {
      addLog(`Please complete all required fields: ${missing.join(", ")}`, "error");
      return;
    }

    setIsSavingSettings(true);
    setIsVerifyingGmail(true);
    addLog("Verifying credentials and encrypting profile...", "info");

    try {
      try {
        await localforage.setItem("outlio_settings", settings);
      } catch (err) {
        console.warn("Browser storage access denied:", err);
      }

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          settings,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to save settings");
      }

      setSyncStatus({ isCloud: true, storageType: "supabase" });
      addLog("Settings verified, encrypted, and saved to database.", "success");
      setSettingsOpen(false);

      if (settings?.LATEX_RESUME?.trim() && onLatexUpdated) {
        onLatexUpdated(settings.LATEX_RESUME);
      }
    } catch (e) {
      addLog(`Settings error: ${e.message}`, "error");
    } finally {
      setIsSavingSettings(false);
      setIsVerifyingGmail(false);
    }
  };

  return {
    settings,
    setSettings,
    settingsRef,
    settingsOpen,
    setSettingsOpen,
    isSavingSettings,
    isVerifyingGmail,
    isFetchingFromCloud,
    handleFetchFromCloud,
    handleSaveSettings,
    syncStatus,
    isConfigured: validateSettings(settings).isValid,
  };
}
