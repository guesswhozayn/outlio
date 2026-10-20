export default function ExtractedFieldsTab({ fields, setFields }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
      <div className="form-group">
        <label>Recipient email</label>
        <input
          type="email"
          placeholder="recruiter@company.com"
          value={fields.email}
          onChange={(e) => setFields({ ...fields, email: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Job title</label>
        <input
          type="text"
          placeholder="Software Engineer"
          value={fields.jobTitle}
          onChange={(e) => setFields({ ...fields, jobTitle: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Company</label>
        <input
          type="text"
          placeholder="Company name"
          value={fields.company}
          onChange={(e) => setFields({ ...fields, company: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Hiring team or contact</label>
        <input
          type="text"
          placeholder="Hiring team or manager"
          value={fields.recipientName}
          onChange={(e) => setFields({ ...fields, recipientName: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Key technologies</label>
        <input
          type="text"
          placeholder="React, Node.js, TypeScript"
          value={fields.skills}
          onChange={(e) => setFields({ ...fields, skills: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Requirements</label>
        <textarea
          placeholder="Key requirements (one per line)..."
          value={
            Array.isArray(fields.keyRequirements)
              ? fields.keyRequirements.join("\n")
              : (fields.keyRequirements || "")
          }
          onChange={(e) => {
            const lines = e.target.value.split("\n");
            setFields({ ...fields, keyRequirements: lines });
          }}
          rows={4}
          style={{ resize: "vertical", minHeight: "90px" }}
        />
      </div>
      <div className="form-group">
        <label>Skills summary</label>
        <textarea
          placeholder="Extracted tech stack and skills..."
          value={fields.comprehensiveSkills}
          onChange={(e) => setFields({ ...fields, comprehensiveSkills: e.target.value })}
          rows={3}
          style={{ resize: "vertical", minHeight: "80px" }}
        />
      </div>
    </div>
  );
}
