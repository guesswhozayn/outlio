export default function EmailPreviewTab({
  isFollowUp,
  setIsFollowUp,
  fields,
  setFields,
  subject,
  setSubject,
  emailBody,
  setEmailBody,
  setIsManuallyEdited,
  resumeExists,
  resumeFile,
  settings,
  handleTailorResume,
  isTailoring,
  handleUploadClick,
  isUploading,
  fileInputRef,
  handleFileChange,
  isSending,
  hasGmailConfig,
  handleSendEmail,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem", flexGrow: 1 }}>
      {isFollowUp && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255, 255, 255, 0.05)", padding: "0.75rem", borderRadius: "var(--radius-md)", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 500 }}>Generating Follow-Up Email</span>
          <button className="btn btn-secondary" style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }} onClick={() => { setIsFollowUp(false); setIsManuallyEdited(false); }}>Cancel Follow-Up</button>
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
          onChange={(e) => { setSubject(e.target.value); setIsManuallyEdited(true); }}
        />
      </div>

      <div className="form-group" style={{ flexGrow: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
          <label style={{ marginBottom: 0 }}>Email Body</label>
        </div>
        <textarea
          className="email-body-input"
          style={{ flexGrow: 1, minHeight: "300px", fontFamily: "inherit" }}
          value={emailBody}
          onChange={(e) => { setEmailBody(e.target.value); setIsManuallyEdited(true); }}
        />
      </div>

      <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="attachment-row flex-row" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="flex-gap-2 attachment-label" style={{ wordBreak: "break-all" }}>
            <span>Attachment:</span>
            <span style={{color: "var(--text-primary)"}}>{resumeExists ? (resumeFile?.name || ((settings.USER_NAME || "user").trim().toLowerCase().replace(/\s+/g, '_') + "_resume.pdf")) : "None"}</span>
          </div>
          <div className="attachment-actions" style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" style={{padding: "0.35rem 0.6rem", fontSize: "0.75rem"}} onClick={handleTailorResume} disabled={isTailoring}>
              {isTailoring ? "Tailoring..." : "Tailor Resume"}
            </button>
            <button className="btn btn-secondary" style={{padding: "0.35rem 0.6rem", fontSize: "0.75rem"}} onClick={handleUploadClick}>
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".pdf" onChange={handleFileChange} />
        </div>
        
        <button
          className="btn btn-success"
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
  );
}
