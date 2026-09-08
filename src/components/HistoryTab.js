export default function HistoryTab({ history, setFields, setIsColdEmail, setIsFollowUp, setActiveTab, setIsManuallyEdited }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem", flexGrow: 1, overflowY: "auto", maxHeight: "60vh", paddingRight: "0.5rem" }}>
      {history.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", marginTop: "2rem" }}>No applications sent yet.</p>
      ) : (
        history.map((item) => (
          <div key={item.id} style={{ padding: "1rem", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)", background: "var(--bg-secondary)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ overflow: "hidden", flex: "1 1 200px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{item.company}</span>
                <span className="badge" style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", background: "var(--bg-primary)", borderColor: "var(--glass-border)", whiteSpace: "nowrap" }}>{item.type}</span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.jobTitle}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.email}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(item.date).toLocaleDateString()}</div>
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem", whiteSpace: "nowrap", flexShrink: 0 }}
              onClick={() => {
                setFields(prev => ({
                  ...prev,
                  email: item.email,
                  company: item.company,
                  jobTitle: item.jobTitle,
                  recipientName: item.recipientName || prev.recipientName,
                  skills: item.skills || prev.skills || "",
                  keyRequirements: item.keyRequirements || prev.keyRequirements || [],
                  comprehensiveSkills: item.comprehensiveSkills || prev.comprehensiveSkills || "",
                  userPhone: item.userPhone || prev.userPhone || "",
                  userLinkedin: item.userLinkedin || prev.userLinkedin || ""
                }));
                setIsColdEmail(false);
                setIsFollowUp(true);
                setIsManuallyEdited(false);
                setActiveTab("preview");
              }}
            >
              Follow Up
            </button>
          </div>
        ))
      )}
    </div>
  );
}
