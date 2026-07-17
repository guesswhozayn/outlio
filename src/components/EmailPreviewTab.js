import { Zap, File, Send } from "lucide-react";

export default function EmailPreviewTab({
  isFollowUp,
  setIsFollowUp,
  isColdEmail,
  setIsColdEmail,
  coldEmailRole,
  setColdEmailRole,
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
      
      {!isFollowUp && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "-0.5rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            <div style={{
              width: "36px", height: "20px", borderRadius: "20px", background: isColdEmail ? "var(--accent-cyan)" : "var(--glass-border)",
              position: "relative", transition: "background 0.3s ease"
            }}>
              <div style={{
                width: "16px", height: "16px", borderRadius: "50%", background: "#fff",
                position: "absolute", top: "2px", left: isColdEmail ? "18px" : "2px", transition: "left 0.3s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
              }} />
            </div>
            <input 
              type="checkbox" 
              checked={isColdEmail} 
              onChange={(e) => { setIsColdEmail(e.target.checked); setIsManuallyEdited(false); }} 
              style={{ display: "none" }}
            />
            Cold Email
          </label>
        </div>
      )}

      {isColdEmail && (
        <div className="form-group">
          <label>Tailor Template</label>
          <select
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-md)",
              padding: "0.5rem",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              outline: "none",
              cursor: "pointer"
            }}
            value={coldEmailRole}
            onChange={(e) => { setColdEmailRole(e.target.value); setIsManuallyEdited(false); }}
          >
            <option value="General">General</option>
            <option value="Frontend">Frontend Development</option>
            <option value="Backend">Backend Development</option>
            <option value="Full Stack">Full Stack Development</option>
            <option value="Software Engineer">Software Engineering</option>
          </select>
        </div>
      )}

      <div className="form-group">
        <label>To</label>
        <input
          type="email"
          placeholder="hr-email@company.com"
          value={fields.email}
          onChange={(e) => setFields({ ...fields, email: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Subject</label>
        <input
          type="text"
          placeholder="Email Subject Line"
          value={subject}
          onChange={(e) => { setSubject(e.target.value); setIsManuallyEdited(true); }}
        />
      </div>

      <div className="form-group" style={{ flexGrow: 1 }}>
        <label>Email Body</label>
        <textarea
          style={{ flexGrow: 1, minHeight: "350px", fontFamily: "inherit" }}
          value={emailBody}
          onChange={(e) => { setEmailBody(e.target.value); setIsManuallyEdited(true); }}
        />
      </div>

      <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="flex-row" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="flex-gap-2" style={{ wordBreak: "break-all" }}>
            <span>Attachment:</span>
            <span style={{color: "var(--text-primary)"}}>{resumeExists ? (resumeFile?.name || ((settings.USER_NAME || "user").trim().toLowerCase().replace(/\s+/g, '_') + "_resume.pdf")) : "None"}</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn btn-secondary" style={{padding: "0.25rem 0.5rem", fontSize: "0.75rem"}} onClick={handleTailorResume} disabled={isTailoring}>
              {isTailoring ? "Tailoring..." : <><Zap size={12} /> Tailor Resume</>}
            </button>
            <button className="btn btn-secondary" style={{padding: "0.25rem 0.5rem", fontSize: "0.75rem"}} onClick={handleUploadClick}>
              {isUploading ? "Uploading..." : <><File size={12} /> Upload</>}
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
            <>
              <Send size={16} /> Send
            </>
          )}
        </button>
      </div>
    </div>
  );
}
