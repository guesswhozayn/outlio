import { useState } from "react";
import { FALLBACK_FREE_MODELS } from "@/lib/openrouter";

export default function SettingsDrawer({
  settingsOpen,
  setSettingsOpen,
  settings,
  setSettings,
  isFetchingModels,
  availableModels = [],
  isSavingSettings,
  handleSaveSettings
}) {
  // Merge fallback models and live available models without duplicates
  const allModelsMap = new Map();

  FALLBACK_FREE_MODELS.forEach((m) => {
    allModelsMap.set(m.name, m);
  });

  if (Array.isArray(availableModels) && availableModels.length > 0) {
    availableModels.forEach((m) => {
      if (m && m.name) {
        allModelsMap.set(m.name, m);
      }
    });
  }

  const currentModel = settings.MODEL || "openrouter/free";
  if (currentModel && currentModel !== "custom" && currentModel !== "__custom__" && !allModelsMap.has(currentModel)) {
    allModelsMap.set(currentModel, {
      name: currentModel,
      displayName: currentModel,
      isVision: false,
    });
  }

  const modelOptions = Array.from(allModelsMap.values());
  modelOptions.sort((a, b) => {
    if (a.name === "openrouter/free") return -1;
    if (b.name === "openrouter/free") return 1;
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
              value={isCustomMode ? "__custom__" : (settings.MODEL || "openrouter/free")}
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
                const label = (m.displayName || m.name)
                  .replace(/\s*\(free\)/gi, "")
                  .replace(/^Free Models Router.*$/i, "Auto (Best Available)");
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
                placeholder="e.g. anthropic/claude-3.5-sonnet"
                value={settings.MODEL || ""}
                onChange={(e) => setSettings({ ...settings, MODEL: e.target.value })}
                style={{ marginTop: "0.5rem" }}
                autoFocus
              />
            )}
            
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Select which model to use for job post extraction and resume tailoring.
            </small>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)" }} />

          <h3>User Signature Profile</h3>

          <div className="form-group">
            <label>Your Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={settings.USER_NAME}
              onChange={(e) => setSettings({ ...settings, USER_NAME: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="+1 (555) 000-0000"
              value={settings.USER_PHONE}
              onChange={(e) => setSettings({ ...settings, USER_PHONE: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>LinkedIn Profile URL</label>
            <input
              type="text"
              placeholder="linkedin.com/in/user"
              value={settings.USER_LINKEDIN}
              onChange={(e) => setSettings({ ...settings, USER_LINKEDIN: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>GitHub Profile URL</label>
            <input
              type="text"
              placeholder="github.com/user"
              value={settings.USER_GITHUB}
              onChange={(e) => setSettings({ ...settings, USER_GITHUB: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Portfolio Website</label>
            <input
              type="text"
              placeholder="portfolio.com"
              value={settings.USER_PORTFOLIO}
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
              value={settings.LATEX_RESUME}
              onChange={(e) => setSettings({ ...settings, LATEX_RESUME: e.target.value })}
            />
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Provide the LaTeX code for your resume. You can use placeholders like {"{{USER_NAME}}"}, {"{{USER_PHONE}}"}, {"{{USER_EMAIL}}"}, {"{{USER_LINKEDIN}}"}, {"{{USER_GITHUB}}"}, or {"{{USER_PORTFOLIO}}"} to dynamically insert your profile details. This will be tailored by AI to match job descriptions.
            </small>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }} disabled={isSavingSettings}>
            {isSavingSettings ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </>
  );
}
