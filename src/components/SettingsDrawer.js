export default function SettingsDrawer({
  settingsOpen,
  setSettingsOpen,
  settings = {},
  setSettings,
  isSavingSettings,
  handleSaveSettings,
  syncStatus = { isCloud: false, storageType: "local_file" }
}) {

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
              Your personal key is stored securely with your profile and used directly for job extraction and resume tailoring with automatic best-model selection.
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
