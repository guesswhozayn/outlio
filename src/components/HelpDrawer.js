"use client";

import { ArrowLeftRight } from "lucide-react";

export default function HelpDrawer({ helpOpen, setHelpOpen }) {
  return (
    <>
      <div
        className={`overlay ${helpOpen ? "active" : ""}`}
        onClick={() => setHelpOpen(false)}
      ></div>

      <div className={`settings-drawer ${helpOpen ? "open" : ""}`} style={{ maxWidth: "440px" }}>
        <div className="drawer-header">
          <h2 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Quick Guide</h2>
          <button className="close-btn" onClick={() => setHelpOpen(false)}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", padding: "0.25rem 0" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            Apply to jobs in 3 quick steps:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            
            {/* Step 1 */}
            <div
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <h3 style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                1. Paste & Extract
              </h3>
              <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Paste the job posting text (or upload a screenshot) and click <strong>Extract</strong>.
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
              <h3 style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                2. Review & Tailor
              </h3>
              <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Check the email draft & resume attachment. Customize your signature details in <strong>Settings</strong> anytime.
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
              <h3 style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                3. Send via Gmail
              </h3>
              <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                Click <strong>Send</strong> to dispatch the application directly from your logged-in Gmail account.
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
