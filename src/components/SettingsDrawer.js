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
  const modelOptions = availableModels.length > 0 ? availableModels : FALLBACK_FREE_MODELS;
  const currentModel = settings.MODEL || "openrouter/free";
  const isKnownModel = modelOptions.some(m => m.name === currentModel);
  const [customSelected, setCustomSelected] = useState(false);

  const isCustomMode = customSelected || (!isKnownModel && Boolean(currentModel));

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
              value={isCustomMode ? "custom" : (isKnownModel ? currentModel : "custom")}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setCustomSelected(true);
                  if (isKnownModel) {
                    setSettings({ ...settings, MODEL: "" });
                  }
                } else {
                  setCustomSelected(false);
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
              <option value="custom">Custom Model...</option>
            </select>
            
            {isCustomMode && (
              <input
                type="text"
                placeholder="Enter custom model identifier (e.g. anthropic/claude-3.5-sonnet)"
                value={settings.MODEL || ""}
                onChange={(e) => setSettings({ ...settings, MODEL: e.target.value })}
                style={{ marginTop: "0.5rem" }}
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
              placeholder="+1 (555) 019-2834"
              value={settings.USER_PHONE}
              onChange={(e) => setSettings({ ...settings, USER_PHONE: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>LinkedIn Profile URL</label>
            <input
              type="text"
              placeholder="linkedin.com/in/username"
              value={settings.USER_LINKEDIN}
              onChange={(e) => setSettings({ ...settings, USER_LINKEDIN: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>GitHub Profile URL</label>
            <input
              type="text"
              placeholder="github.com/username"
              value={settings.USER_GITHUB}
              onChange={(e) => setSettings({ ...settings, USER_GITHUB: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Portfolio Website</label>
            <input
              type="text"
              placeholder="yourportfolio.com"
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

          <div
            style={{
              padding: "0.875rem",
              borderRadius: "var(--radius-md)",
              background: "rgba(10, 102, 194, 0.08)",
              border: "1px solid rgba(10, 102, 194, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              📱 Mobile & LinkedIn Share
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              <strong>Android:</strong> Tap browser menu &rarr; <em>Install App</em>. Then tap <em>Share &rarr; Share via... &rarr; Outlio</em> on LinkedIn.<br />
              <strong>iPhone:</strong> In Apple <em>Shortcuts</em> app, add a shortcut to receive URLs/Text in Share Sheet and open: <code style={{ fontSize: "0.72rem", background: "var(--surface-active)", padding: "2px 4px", borderRadius: "4px" }}>https://outlioai.vercel.app/share-target?text=[Input]</code>.
            </p>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }} disabled={isSavingSettings}>
            {isSavingSettings ? "Saving Settings..." : "Save Settings"}
          </button>
        </form>
      </div>
    </>
  );
}
