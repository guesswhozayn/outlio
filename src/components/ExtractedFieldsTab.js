export default function ExtractedFieldsTab({ fields, setFields }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
      <div className="form-group">
        <label>HR Recipient Email</label>
        <input
          type="email"
          placeholder="hr-email@company.com"
          value={fields.email}
          onChange={(e) => setFields({ ...fields, email: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Job Title (Position)</label>
        <input
          type="text"
          placeholder="Software Engineer"
          value={fields.jobTitle}
          onChange={(e) => setFields({ ...fields, jobTitle: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Company Name</label>
        <input
          type="text"
          placeholder="Acme Corp"
          value={fields.company}
          onChange={(e) => setFields({ ...fields, company: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Hiring Manager / Team</label>
        <input
          type="text"
          placeholder="Hiring Team / John Doe"
          value={fields.recipientName}
          onChange={(e) => setFields({ ...fields, recipientName: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Key Technologies / Field</label>
        <input
          type="text"
          placeholder="React, Node.js"
          value={fields.skills}
          onChange={(e) => setFields({ ...fields, skills: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Comprehensive Skills</label>
        <textarea
          placeholder="React, Node.js, Frontend Architecture, UI/UX..."
          value={fields.comprehensiveSkills}
          onChange={(e) => setFields({ ...fields, comprehensiveSkills: e.target.value })}
          rows={3}
          style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-primary)", resize: "vertical" }}
        />
      </div>
    </div>
  );
}
