import { useState } from "react";
import { FALLBACK_MODELS, DEFAULT_MODEL } from "@/lib/gemini";

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
  };

  const modelOptions = Array.from(allModelsMap.values());
  modelOptions.sort((a, b) => {
    const rankA = modelRank[a.name] || 99;
    const rankB = modelRank[b.name] || 99;
    if (rankA !== rankB) return rankA - rankB;
    return (a.displayName || a.name).localeCompare(b.displayName || b.name);
  });

  const [isCustomMode, setIsCustomMode] = useState(false);

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
              <label style={{ margin: 0 }}>Gemini API Key</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", textDecoration: "none" }}
              >
                Get free key
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
                placeholder="e.g. gemini-3.8-flash"
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

          <h3>Email Styling Preferences</h3>

          <div className="form-group">
            <label>Default Font Style</label>
            <select
              value={settings?.EMAIL_FONT_FAMILY || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"}
              onChange={(e) => setSettings({ ...settings, EMAIL_FONT_FAMILY: e.target.value })}
            >
              <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">Sans Serif</option>
              <option value="Georgia, serif">Georgia (Serif)</option>
              <option value="'Times New Roman', Times, serif">Times New Roman</option>
              <option value="'Courier New', Courier, monospace">Courier New (Mono)</option>
              <option value="'Trebuchet MS', 'Lucida Sans Unicode', sans-serif">Trebuchet MS</option>
              <option value="Arial, Helvetica, sans-serif">Arial</option>
            </select>
          </div>

          <div className="form-group">
            <label>Default Font Size</label>
            <select
              value={settings?.EMAIL_FONT_SIZE || "15px"}
              onChange={(e) => setSettings({ ...settings, EMAIL_FONT_SIZE: e.target.value })}
            >
              <option value="13px">Small (13px)</option>
              <option value="15px">Normal (15px)</option>
              <option value="18px">Medium (18px)</option>
              <option value="22px">Large (22px)</option>
              <option value="26px">Heading (26px)</option>
            </select>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", marginTop: "1rem", marginBottom: "0.5rem" }} />
          
          <h3>Resume Configuration</h3>

          <div className="form-group">
            <label>Base LaTeX Resume Code</label>
            <textarea
              style={{ flexGrow: 1, minHeight: "150px", fontFamily: "var(--font-mono)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.85rem" }}
              placeholder="\documentclass{article}..."
              value={settings?.LATEX_RESUME || ""}
              onChange={(e) => setSettings({ ...settings, LATEX_RESUME: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: "0.75rem", minHeight: "44px" }} disabled={isSavingSettings}>
            {isSavingSettings ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </>
  );
}
