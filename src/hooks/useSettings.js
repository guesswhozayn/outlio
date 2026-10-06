import { useState, useRef, useCallback, useEffect } from "react";
import localforage from "localforage";
import { signIn } from "next-auth/react";

export const INITIAL_SETTINGS = {
  GEMINI_API_KEY: "",
  MODEL: "gemini-3.8-flash",
  USER_NAME: "",
  USER_PHONE: "",
  USER_LINKEDIN: "",
  USER_GITHUB: "",
  USER_PORTFOLIO: "",
  LATEX_RESUME: "",
};

export function useSettings({ session, status, addLog }) {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ isCloud: false, storageType: "local_file" });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const hasInitializedUserRef = useRef(null);

  const fetchAvailableModels = useCallback(async (keyOverride) => {
    setIsFetchingModels(true);
    try {
      const apiKey = keyOverride !== undefined ? keyOverride : settingsRef.current.GEMINI_API_KEY;
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.models) && data.models.length > 0) {
        setAvailableModels(data.models);
      }
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

  const loadSettings = useCallback(async () => {
    try {
      const email = session?.user?.email;
      let localSettings = {};
      if (email) {
        try {
          localSettings = (await localforage.getItem(`outlio_settings_${email}`)) || {};
        } catch (err) {
          console.warn("Browser storage access denied:", err);
        }
      }

      let pendingSettings = null;
      try {
        const pendingRaw = typeof window !== "undefined" ? localStorage.getItem("outlio_pending_settings") : null;
        if (pendingRaw) {
          pendingSettings = JSON.parse(pendingRaw);
          localStorage.removeItem("outlio_pending_settings");
        }
      } catch (err) {
        console.warn("Could not read pending settings:", err);
      }

      const res = await fetch("/api/settings", { cache: "no-store" });
      const parsed = await res.json();

      if (parsed && parsed._sync) {
        setSyncStatus(parsed._sync);
        delete parsed._sync;
      }

      let finalSettings = { ...localSettings };

      if (parsed && typeof parsed === "object" && !parsed.error && Object.keys(parsed).length > 0) {
        finalSettings = { ...finalSettings, ...parsed };
      }

      if (pendingSettings && Object.keys(pendingSettings).length > 0) {
        finalSettings = { ...finalSettings, ...pendingSettings };
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(finalSettings),
        }).catch(err => console.error("Auto-sync pending settings failed:", err));
        addLog("Pending configuration settings applied to your account.", "success");
      }

      if (email && Object.keys(finalSettings).length > 0) {
        try {
          await localforage.setItem(`outlio_settings_${email}`, finalSettings);
        } catch (err) {
          console.warn("Browser storage access denied:", err);
        }
      }

      let savedModel = finalSettings.MODEL || finalSettings.GEMINI_MODEL || "gemini-3.8-flash";
      if (typeof savedModel !== "string" || !savedModel.startsWith("gemini") || savedModel.includes("gemini-2.0")) {
        savedModel = "gemini-3.8-flash";
      }
      finalSettings.MODEL = savedModel;
      if (!finalSettings.USER_NAME && session?.user?.name) {
        finalSettings.USER_NAME = session.user.name;
      }

      setSettings({ ...INITIAL_SETTINGS, ...finalSettings });
      fetchAvailableModels(finalSettings.GEMINI_API_KEY);
    } catch (e) {
      console.error(e);
    }
  }, [session, fetchAvailableModels, addLog]);

  useEffect(() => {
    if (status === "authenticated") {
      const userKey = session?.user?.email || "authenticated_user";
      if (hasInitializedUserRef.current !== userKey) {
        hasInitializedUserRef.current = userKey;
        loadSettings();
        addLog("Dashboard initialized. Ready to process jobs.", "info");
      }
    } else if (status === "unauthenticated") {
      hasInitializedUserRef.current = null;
    }
  }, [status, session?.user?.email, loadSettings, addLog]);

  const handleSaveSettings = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    if (status === "unauthenticated") {
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("outlio_pending_settings", JSON.stringify(settings));
        }
        addLog("Settings cached locally. Redirecting to Google sign-in...", "info");
      } catch (err) {
        console.warn("Could not cache pending settings:", err);
      }
      signIn("google");
      return;
    }
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

      const resData = await res.json();
      if (resData.isCloud) {
        setSyncStatus({ isCloud: true, storageType: resData.storageType || "supabase" });
        addLog("Settings saved and synced to cloud.", "success");
      } else {
        setSyncStatus({ isCloud: false, storageType: resData.storageType || "local_file" });
        addLog("Settings saved to this device.", "info");
      }
      setSettingsOpen(false);
      fetchAvailableModels(settings.GEMINI_API_KEY);
    } catch (e) {
      addLog(`Error saving settings: ${e.message}`, "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  return {
    settings,
    setSettings,
    settingsRef,
    settingsOpen,
    setSettingsOpen: handleSetSettingsOpen,
    isSavingSettings,
    handleSaveSettings,
    availableModels,
    setAvailableModels,
    isFetchingModels,
    fetchAvailableModels,
    syncStatus,
  };
}
