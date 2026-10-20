import { useEffect } from "react";

export default function SettingsDrawer({
  settingsOpen,
  setSettingsOpen,
  settings = {},
  setSettings,
  isSavingSettings,
  handleSaveSettings,
  syncStatus = { isCloud: false, storageType: "local_file" }
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
            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                <label style={{ margin: 0 }}>Gemini API key</label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", textDecoration: "none" }}
                >
                  Get API key
                </a>
              </div>
              <input
                type="password"
                placeholder={settings?.GEMINI_API_KEY ? "••••••••••••••••••••" : "Paste your Gemini API key"}
                value={settings?.GEMINI_API_KEY || ""}
                onChange={(e) => setSettings({ ...settings, GEMINI_API_KEY: e.target.value })}
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)" }} />

            <h3>Signature</h3>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Your full name"
                value={settings?.USER_NAME || ""}
                onChange={(e) => setSettings({ ...settings, USER_NAME: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                placeholder="+1 (555) 000-0000"
                value={settings?.USER_PHONE || ""}
                onChange={(e) => setSettings({ ...settings, USER_PHONE: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>LinkedIn</label>
              <input
                type="text"
                placeholder="https://linkedin.com/in/username"
                value={settings?.USER_LINKEDIN || ""}
                onChange={(e) => setSettings({ ...settings, USER_LINKEDIN: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>GitHub</label>
              <input
                type="text"
                placeholder="https://github.com/username"
                value={settings?.USER_GITHUB || ""}
                onChange={(e) => setSettings({ ...settings, USER_GITHUB: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Portfolio</label>
              <input
                type="text"
                placeholder="https://yourportfolio.com"
                value={settings?.USER_PORTFOLIO || ""}
                onChange={(e) => setSettings({ ...settings, USER_PORTFOLIO: e.target.value })}
              />
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", marginTop: "1rem", marginBottom: "0.5rem" }} />

            <h3>Email</h3>

            <div className="form-group">
              <label>Font</label>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label style={{ margin: 0 }}>LaTeX template</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {
                    !settings?.LATEX_RESUME && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
                        onClick={() => {
                          const sampleTemplate = `\\documentclass[letterpaper,10pt]{article}
\\usepackage[left=0.75in,top=0.6in,right=0.75in,bottom=0.6in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\begin{document}
\\begin{center}
  {\\LARGE \\textbf{{{USER_NAME}}}}\\\\
  \\vspace{2pt}
  \\small {{USER_PHONE}} $|$ \\href{mailto:{{USER_EMAIL}}}{{USER_EMAIL}} $|$ \\href{{{USER_LINKEDIN}}}{LinkedIn} $|$ \\href{{{USER_GITHUB}}}{GitHub}
\\end{center}

\\section*{Experience}
\\textbf{Software Engineer} -- Tech Corp \\hfill 2022 -- Present\\\\
\\begin{itemize}[noitemsep,topsep=0pt]
  \\item Developed and deployed scalable full-stack web applications.
  \\item Improved API latency by 35% through query optimization and caching.
\\end{itemize}

\\section*{Skills}
\\textbf{Languages \\& Frameworks:} JavaScript, TypeScript, React, Next.js, Node.js, Python, PostgreSQL.

\\end{document}`;
                          setSettings({ ...settings, LATEX_RESUME: sampleTemplate });
                        }}
                      >
                        Insert template
                      </button>
                    )
                  }
                </div>
              </div>
              <textarea
                style={{ flexGrow: 1, minHeight: "220px", fontFamily: "var(--font-mono)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                placeholder="\documentclass{article}..."
                value={settings?.LATEX_RESUME || ""}
                onChange={(e) => setSettings({ ...settings, LATEX_RESUME: e.target.value })}
              />
            </div>
          </div>

          <div className="drawer-footer">
            <button type="submit" className="btn btn-primary" style={{ minHeight: "40px", minWidth: "100px" }} disabled={isSavingSettings}>
              {isSavingSettings ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
