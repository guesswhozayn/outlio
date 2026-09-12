"use client";

export default function HelpDrawer({ helpOpen, setHelpOpen }) {
  return (
    <>
      <div
        className={`overlay ${helpOpen ? "active" : ""}`}
        onClick={() => setHelpOpen(false)}
      ></div>

      <div className={`settings-drawer ${helpOpen ? "open" : ""}`} style={{ maxWidth: "480px" }}>
        <div className="drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700" }}>How to Use Outlio</h2>
          </div>
          <button className="close-btn" onClick={() => setHelpOpen(false)}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "0.5rem 0" }}>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            Outlio automates cold job applications and recruiter outreach using AI and your connected Gmail account.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            
            {/* Step 1 */}
            <div
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <h3 style={{ fontSize: "0.92rem", fontWeight: "600", marginBottom: "0.2rem" }}>
                1. Extract Job Details
              </h3>
              <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Paste a job description or upload a screenshot, then click <strong>Extract Details</strong>.
              </p>
            </div>

            {/* Step 2 */}
            <div
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <h3 style={{ fontSize: "0.92rem", fontWeight: "600", marginBottom: "0.2rem" }}>
                2. Switch Between Views
              </h3>
              <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Use the switch button to toggle between the Job Description box and Email Preview.
              </p>
            </div>

            {/* Step 3 */}
            <div
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <h3 style={{ fontSize: "0.92rem", fontWeight: "600", marginBottom: "0.2rem" }}>
                3. Resume & Profile
              </h3>
              <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Upload a PDF resume or set up a LaTeX template in <strong>Settings</strong> for auto-tailored resumes.
              </p>
            </div>

            {/* Step 4 */}
            <div
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <h3 style={{ fontSize: "0.92rem", fontWeight: "600", marginBottom: "0.2rem" }}>
                4. Send Direct Email
              </h3>
              <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Click <strong>Send Email</strong> to send your job application instantly via Gmail.
              </p>
            </div>

            {/* Step 5 */}
            <div
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <h3 style={{ fontSize: "0.92rem", fontWeight: "600", marginBottom: "0.2rem" }}>
                5. Track Applications
              </h3>
              <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                View sent applications and generate follow-up emails anytime from the <strong>History</strong> tab.
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
