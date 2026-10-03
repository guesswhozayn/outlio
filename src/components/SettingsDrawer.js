import { useState, useRef } from "react";
import { FALLBACK_MODELS, DEFAULT_MODEL } from "@/lib/gemini";
import { Download, Upload } from "lucide-react";

export default function SettingsDrawer({
  settingsOpen,
  setSettingsOpen,
  settings = {},
  setSettings,
  isFetchingModels,
  availableModels = [],
  isSavingSettings,
  handleSaveSettings,
  syncStatus = { isCloud: false, storageType: "local_file" }
}) {
  const allModelsMap = new Map();
  const importFileRef = useRef(null);

  FALLBACK_MODELS.forEach((m) => {
    allModelsMap.set(m.name, m);
  });

  if (Array.isArray(availableModels) && availableModels.length > 0) {
    availableModels.forEach((m) => {
      if (m && m.name) {
        allModelsMap.set(m.name, m);
      }
    });
  }

  const currentModel = settings?.MODEL || DEFAULT_MODEL;
  if (
    currentModel &&
    currentModel !== "custom" &&
    currentModel !== "__custom__" &&
    currentModel.startsWith("gemini") &&
    !allModelsMap.has(currentModel)
  ) {
    allModelsMap.set(currentModel, {
      name: currentModel,
      displayName: currentModel,
      isVision: true,
    });
  }

  const modelRank = {
    "gemini-3.8-flash": 1,
    "gemini-3.5-flash": 2,
    "gemini-3.1-pro": 3,
    "gemini-3.1-flash-lite": 4,
    "gemini-2.5-pro": 5,
    "gemini-2.5-flash": 6,
  };

  const modelOptions = Array.from(allModelsMap.values());
  modelOptions.sort((a, b) => {
    const rankA = modelRank[a.name] || 99;
    const rankB = modelRank[b.name] || 99;
    if (rankA !== rankB) return rankA - rankB;
    return (a.displayName || a.name).localeCompare(b.displayName || b.name);
  });

  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleExport = () => {
    try {
      const exportData = {
        GEMINI_API_KEY: settings?.GEMINI_API_KEY || "",
        MODEL: settings?.MODEL || DEFAULT_MODEL,
        USER_NAME: settings?.USER_NAME || "",
        USER_PHONE: settings?.USER_PHONE || "",
        USER_LINKEDIN: settings?.USER_LINKEDIN || "",
        USER_GITHUB: settings?.USER_GITHUB || "",
        USER_PORTFOLIO: settings?.USER_PORTFOLIO || "",
        LATEX_RESUME: settings?.LATEX_RESUME || "",
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `outlio_settings_${(settings?.USER_NAME || "profile").toLowerCase().replace(/[^a-z0-9]/gi, "_")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export settings:", err);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && typeof imported === "object") {
          setSettings((prev) => ({
            ...prev,
            GEMINI_API_KEY: imported.GEMINI_API_KEY !== undefined ? imported.GEMINI_API_KEY : (prev.GEMINI_API_KEY || ""),
            MODEL: imported.MODEL || prev.MODEL || DEFAULT_MODEL,
            USER_NAME: imported.USER_NAME || prev.USER_NAME || "",
            USER_PHONE: imported.USER_PHONE || prev.USER_PHONE || "",
            USER_LINKEDIN: imported.USER_LINKEDIN || prev.USER_LINKEDIN || "",
            USER_GITHUB: imported.USER_GITHUB !== undefined ? imported.USER_GITHUB : (prev.USER_GITHUB || ""),
            USER_PORTFOLIO: imported.USER_PORTFOLIO !== undefined ? imported.USER_PORTFOLIO : (prev.USER_PORTFOLIO || ""),
            LATEX_RESUME: imported.LATEX_RESUME !== undefined ? imported.LATEX_RESUME : (prev.LATEX_RESUME || ""),
          }));
        }
      } catch {
        alert("Invalid JSON settings file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <>
      <div className={`overlay ${settingsOpen ? "active" : ""}`} onClick={() => setSettingsOpen(false)}></div>
      
      <div className={`settings-drawer ${settingsOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h2>Configuration Settings</h2>
          <button className="close-btn" onClick={() => setSettingsOpen(false)}>×</button>
        </div>

        <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
              <label style={{ margin: 0 }}>Gemini API Key (BYOK)</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", textDecoration: "none" }}
              >
                Get free key ↗
              </a>
            </div>
            <input
              type="password"
              placeholder={settings?.GEMINI_API_KEY ? "••••••••••••••••••••" : "Paste your Google AI Studio API key"}
              value={settings?.GEMINI_API_KEY || ""}
              onChange={(e) => setSettings({ ...settings, GEMINI_API_KEY: e.target.value })}
              autoComplete="off"
              spellCheck="false"
            />
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Your personal key is stored securely with your profile and used directly for job extraction and resume tailoring.
            </small>
          </div>

          <div className="form-group">
            <label>
              AI Model {isFetchingModels && <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)" }}>(updating models...)</span>}
            </label>
            <select
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem 1rem",
                color: "var(--text-primary)",
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                outline: "none",
                cursor: "pointer"
              }}
              value={isCustomMode ? "__custom__" : (settings?.MODEL || DEFAULT_MODEL)}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setIsCustomMode(true);
                } else {
                  setIsCustomMode(false);
                  setSettings({ ...settings, MODEL: e.target.value });
                }
              }}
            >
              {modelOptions.map((m) => {
                const label = m.displayName || m.name;
                return (
                  <option key={m.name} value={m.name}>
                    {label}
                  </option>
                );
              })}
              <option value="__custom__">Custom Model...</option>
            </select>
            
            {isCustomMode && (
              <input
                type="text"
                placeholder="e.g. gemini-2.5-pro"
                value={settings?.MODEL || ""}
                onChange={(e) => setSettings({ ...settings, MODEL: e.target.value })}
                style={{ marginTop: "0.5rem" }}
                autoFocus
              />
            )}
            
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Select which Gemini model to use for job post extraction and resume tailoring.
            </small>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)" }} />

          <h3>User Signature Profile</h3>

          <div className="form-group">
            <label>Your Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={settings?.USER_NAME || ""}
              onChange={(e) => setSettings({ ...settings, USER_NAME: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="+1 (555) 000-0000"
              value={settings?.USER_PHONE || ""}
              onChange={(e) => setSettings({ ...settings, USER_PHONE: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>LinkedIn Profile URL</label>
            <input
              type="text"
              placeholder="linkedin.com/in/user"
              value={settings?.USER_LINKEDIN || ""}
              onChange={(e) => setSettings({ ...settings, USER_LINKEDIN: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>GitHub Profile URL</label>
            <input
              type="text"
              placeholder="github.com/user"
              value={settings?.USER_GITHUB || ""}
              onChange={(e) => setSettings({ ...settings, USER_GITHUB: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Portfolio Website</label>
            <input
              type="text"
              placeholder="portfolio.com"
              value={settings?.USER_PORTFOLIO || ""}
              onChange={(e) => setSettings({ ...settings, USER_PORTFOLIO: e.target.value })}
            />
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", marginTop: "1rem", marginBottom: "0.5rem" }} />
          
          <h3>Resume Configuration</h3>

          <div className="form-group">
            <label>Base LaTeX Resume Code</label>
            <textarea
              style={{ flexGrow: 1, minHeight: "150px", fontFamily: "var(--font-mono)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontSize: "0.85rem" }}
              placeholder="\documentclass{article}..."
              value={settings?.LATEX_RESUME || ""}
              onChange={(e) => setSettings({ ...settings, LATEX_RESUME: e.target.value })}
            />
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Provide the LaTeX code for your resume. You can use placeholders like {"{{USER_NAME}}"}, {"{{USER_PHONE}}"}, {"{{USER_EMAIL}}"}, {"{{USER_LINKEDIN}}"}, {"{{USER_GITHUB}}"}, or {"{{USER_PORTFOLIO}}"} to dynamically insert your profile details. This will be tailored by AI to match job descriptions.
            </small>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExport}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                fontSize: "0.825rem",
                padding: "0.55rem 0.75rem",
              }}
              title="Download your settings as a JSON file to transfer between devices"
            >
              <Download size={14} />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => importFileRef.current?.click()}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.35rem",
                fontSize: "0.825rem",
                padding: "0.55rem 0.75rem",
              }}
              title="Import settings from a previously saved JSON file"
            >
              <Upload size={14} />
              <span>Import JSON</span>
            </button>
            <input
              type="file"
              ref={importFileRef}
              accept=".json"
              style={{ display: "none" }}
              onChange={handleImport}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: "0.75rem" }} disabled={isSavingSettings}>
            {isSavingSettings ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </>
  );
}
