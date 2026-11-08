import { useEffect } from "react";

export default function SettingsDrawer({
  settingsOpen,
  setSettingsOpen,
  settings = {},
  setSettings,
  isSavingSettings,
  isVerifyingGmail,
  isFetchingFromCloud,
  handleFetchFromCloud,
  handleSaveSettings,
}) {
  useEffect(() => {
    if (!settingsOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSettingsOpen(false);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveSettings(e);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen, setSettingsOpen, handleSaveSettings]);

  return (
    <>
      <div className={`overlay ${settingsOpen ? "active" : ""}`} onClick={() => setSettingsOpen(false)}></div>
      
      <div className={`settings-drawer ${settingsOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <h2>Settings</h2>
          <button type="button" className="close-btn" onClick={() => setSettingsOpen(false)}>×</button>
        </div>

        <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
          <div className="drawer-content">
            <h3>Gmail Authentication</h3>

            <div className="form-group">
              <label>Gmail Address</label>
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={settings?.GMAIL_USER || ""}
                onChange={(e) => setSettings({ ...settings, GMAIL_USER: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                <label style={{ margin: 0 }}>Gmail App Password</label>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", textDecoration: "none" }}
                >
                  Create App Password
                </a>
              </div>
              <input
                type="password"
                placeholder="16-character password"
                value={settings?.GMAIL_APP_PASSWORD || ""}
                onChange={(e) => setSettings({ ...settings, GMAIL_APP_PASSWORD: e.target.value })}
                autoComplete="off"
                spellCheck="false"
                required
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.25rem", minHeight: "40px" }}
              disabled={isFetchingFromCloud || !settings?.GMAIL_USER?.trim() || !settings?.GMAIL_APP_PASSWORD?.trim()}
              onClick={handleFetchFromCloud}
            >
              {isFetchingFromCloud ? "Verifying..." : "Verify"}
            </button>

            <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", marginTop: "1rem", marginBottom: "0.5rem" }} />

            <h3>Signature</h3>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={settings?.USER_NAME || ""}
                onChange={(e) => setSettings({ ...settings, USER_NAME: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                placeholder="+1 555-0100"
                value={settings?.USER_PHONE || ""}
                onChange={(e) => setSettings({ ...settings, USER_PHONE: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                type="text"
                placeholder="https://linkedin.com/in/janedoe"
                value={settings?.USER_LINKEDIN || ""}
                onChange={(e) => setSettings({ ...settings, USER_LINKEDIN: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>GitHub URL</label>
              <input
                type="text"
                placeholder="https://github.com/janedoe"
                value={settings?.USER_GITHUB || ""}
                onChange={(e) => setSettings({ ...settings, USER_GITHUB: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Portfolio URL</label>
              <input
                type="text"
                placeholder="https://janedoe.dev"
                value={settings?.USER_PORTFOLIO || ""}
                onChange={(e) => setSettings({ ...settings, USER_PORTFOLIO: e.target.value })}
              />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", marginTop: "1rem", marginBottom: "0.5rem" }} />

            <h3>Email typography</h3>

            <div className="form-group">
              <label>Font family</label>
              <select
                value={settings?.EMAIL_FONT_FAMILY || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"}
                onChange={(e) => setSettings({ ...settings, EMAIL_FONT_FAMILY: e.target.value })}
              >
                <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">System Sans (Default)</option>
                <option value="Arial, Helvetica, sans-serif">Arial</option>
                <option value="Calibri, Candara, Segoe, Segoe UI, Optima, Arial, sans-serif">Calibri</option>
                <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica Neue</option>
                <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">Segoe UI</option>
                <option value="Georgia, Times, 'Times New Roman', serif">Georgia</option>
                <option value="'Times New Roman', Times, Baskerville, Georgia, serif">Times New Roman</option>
                <option value="Garfield, 'Garamond', Georgia, serif">Garamond</option>
                <option value="'Courier New', Courier, Lucida Sans Typewriter, Lucida Typewriter, monospace">Courier New</option>
              </select>
            </div>

            <div className="form-group">
              <label>Font size</label>
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
            
            <h3>Resume</h3>

            <div className="form-group">
              <label style={{ marginBottom: "0.35rem", display: "block" }}>LaTeX template</label>
              <textarea
                style={{ flexGrow: 1, minHeight: "220px", fontFamily: "var(--font-mono)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                placeholder="\documentclass{article}..."
                value={settings?.LATEX_RESUME || ""}
                onChange={(e) => setSettings({ ...settings, LATEX_RESUME: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="drawer-footer">
            <button type="submit" className="btn btn-primary" style={{ width: "100%", minHeight: "40px" }} disabled={isSavingSettings}>
              {isVerifyingGmail ? "Verifying..." : (isSavingSettings ? "Saving..." : "Save")}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
