import { useState, useSyncExternalStore } from "react";
import { FALLBACK_FREE_MODELS } from "@/lib/openrouter";
import { Smartphone, Copy, Check, ExternalLink } from "lucide-react";

const emptySubscribe = () => () => {};

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
  const [copiedShortcutUrl, setCopiedShortcutUrl] = useState(false);

  const currentHost = useSyncExternalStore(
    emptySubscribe,
    () => (typeof window !== "undefined" ? window.location.host : "outlioai.vercel.app"),
    () => "outlioai.vercel.app"
  );

  const webappPrefix = `webapp://${currentHost}/share-target?text=`;

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
              padding: "1rem",
              borderRadius: "var(--radius-md)",
              background: "rgba(10, 102, 194, 0.08)",
              border: "1px solid rgba(10, 102, 194, 0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Smartphone size={16} style={{ color: "var(--accent-primary, #6366f1)" }} /> Mobile & LinkedIn Share
            </div>

            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              <p style={{ margin: "0 0 0.5rem 0" }}>
                <strong>Android:</strong> Tap browser menu &rarr; <em>Install App</em>. Then tap <em>Share &rarr; Share via... &rarr; Outlio</em> on any LinkedIn post.
              </p>

              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "0.5rem" }}>
                <p style={{ margin: "0 0 0.4rem 0", color: "var(--text-primary)", fontWeight: 600 }}>
                  <strong>iPhone (Open directly in Web App instead of Safari):</strong>
                </p>
                <ol style={{ margin: "0 0 0.5rem 0", paddingLeft: "1.2rem", fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <li>First, add Outlio to your Home Screen: In Safari, tap Share (⎙) &rarr; <em>Add to Home Screen</em>.</li>
                  <li>Open Apple <strong>Shortcuts</strong> app &rarr; tap <strong>+</strong> (New Shortcut).</li>
                  <li>Tap (ⓘ) Details &rarr; turn ON <strong>Show in Share Sheet</strong> (Accepts: Text, URLs).</li>
                  <li>Add action: <strong>URL Encode</strong> &rarr; select <em>Shortcut Input</em>.</li>
                  <li>Add action: <strong>URL</strong> &rarr; enter: <code style={{ fontSize: "0.7rem", background: "var(--surface-active)", padding: "2px 4px", borderRadius: "3px", wordBreak: "break-all", overflowWrap: "anywhere", display: "inline" }}>{webappPrefix}[URL Encoded Text]</code></li>
                  <li>Add action: <strong>Open URLs</strong> &rarr; select <em>URL</em>.</li>
                </ol>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(webappPrefix);
                        setCopiedShortcutUrl(true);
                        setTimeout(() => setCopiedShortcutUrl(false), 2000);
                      }
                    }}
                  >
                    {copiedShortcutUrl ? <Check size={13} style={{ color: "var(--success, #10b981)" }} /> : <Copy size={13} />}
                    {copiedShortcutUrl ? "Copied Web App URL!" : "Copy Web App URL"}
                  </button>

                  <a
                    href={`${webappPrefix}test`}
                    className="btn btn-secondary"
                    style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", textDecoration: "none", color: "var(--text-secondary)" }}
                    title="Tests if your iPhone opens the installed Web App"
                  >
                    <ExternalLink size={13} /> Test Web App Launch
                  </a>
                </div>
                <small style={{ display: "block", marginTop: "0.4rem", color: "var(--text-muted)", fontSize: "0.7rem" }}>
                  💡 Using <code>webapp://</code> forces iOS to launch the installed Web App directly, avoiding Safari browser tabs.
                </small>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }} disabled={isSavingSettings}>
            {isSavingSettings ? "Saving Settings..." : "Save Settings"}
          </button>
        </form>
      </div>
    </>
  );
}
