export default function EmailPreviewTab({
  isFollowUp,
  setIsFollowUp,
  fields,
  setFields,
  subject,
  setSubject,
  emailBody,
  setEmailBody,
  emailHtml,
  setEmailHtml,
  setIsManuallyEdited,
  resumeExists,
  settings,
  handleTailorResume,
  isTailoring,
  isSending,
  hasGmailConfig,
  handleSendEmail,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem", flexGrow: 1 }}>
      {isFollowUp && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--glass-border)", padding: "0.75rem", borderRadius: "var(--radius-md)", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 500 }}>Generating Follow-Up Email</span>
          <button className="btn btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} onClick={() => { setIsFollowUp(false); if (setIsManuallyEdited) setIsManuallyEdited(false); }}>Cancel Follow-Up</button>
        </div>
      )}

      <div className="form-group">
        <label>To</label>
        <input
          type="email"
          placeholder="recruiter@company.com"
          value={fields.email}
          onChange={(e) => setFields({ ...fields, email: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Subject</label>
        <input
          type="text"
          placeholder="Email subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className="form-group" style={{ flexGrow: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
          <label style={{ margin: 0 }}>Email Body</label>
        </div>
        <textarea
          className="email-body-input"
          style={{
            flexGrow: 1,
            minHeight: "300px",
            fontFamily: settings?.EMAIL_FONT_FAMILY || "inherit",
            fontSize: settings?.EMAIL_FONT_SIZE || "15px",
            lineHeight: "1.6",
          }}
          value={emailBody}
          onChange={(e) => {
            setEmailBody(e.target.value);
            if (setIsManuallyEdited) setIsManuallyEdited(true);
          }}
          placeholder="Compose your email..."
        />
      </div>

      <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: resumeExists ? "var(--accent)" : "var(--glass-border)" }}></span>
          <span>{resumeExists ? "Resume attached" : "No resume"}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", minHeight: "38px" }}
            onClick={handleTailorResume}
            disabled={isTailoring}
          >
            {isTailoring ? "Optimizing..." : "Optimize"}
          </button>
          
          <button
            className="btn btn-success"
            style={{ minHeight: "38px", minWidth: "90px" }}
            disabled={isSending || !fields.email || !resumeExists || !hasGmailConfig}
            onClick={handleSendEmail}
          >
            {isSending ? (
              <>
                <div className="spinner"></div> Sending...
              </>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
