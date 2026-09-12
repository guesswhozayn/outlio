export default function ExtractedFieldsTab({ fields, setFields }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>
      <div className="form-group">
        <label>HR Recipient Email</label>
        <input
          type="email"
          placeholder="recruiter@company.com"
          value={fields.email}
          onChange={(e) => setFields({ ...fields, email: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Job Title (Position)</label>
        <input
          type="text"
          placeholder="Job title"
          value={fields.jobTitle}
          onChange={(e) => setFields({ ...fields, jobTitle: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Company Name</label>
        <input
          type="text"
          placeholder="Company name"
          value={fields.company}
          onChange={(e) => setFields({ ...fields, company: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Hiring Manager / Team</label>
        <input
          type="text"
          placeholder="Hiring Manager / Team"
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
        <label>Key Requirements / Responsibilities (One per line)</label>
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
        <label>Comprehensive Skills</label>
        <textarea
          placeholder="Extracted tech stack & skills..."
          value={fields.comprehensiveSkills}
          onChange={(e) => setFields({ ...fields, comprehensiveSkills: e.target.value })}
          rows={3}
          style={{ resize: "vertical", minHeight: "80px" }}
        />
      </div>
    </div>
  );
}
