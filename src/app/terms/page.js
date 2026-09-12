import Link from "next/link";
import { ArrowLeft, Scale, ShieldAlert, CheckCircle2, AlertTriangle, FileText, Globe } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Outlio",
  description: "Terms of Service for Outlio. Review the terms, conditions, and acceptable use policies governing your use of our platform.",
};

export default function TermsOfServicePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        
        {/* Navigation / Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--text-secondary)",
              textDecoration: "none",
              fontSize: "0.9rem",
              padding: "0.5rem 0.85rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--glass-border)",
              background: "var(--bg-secondary)",
              transition: "var(--transition)",
            }}
          >
            <ArrowLeft size={16} /> Back to Outlio
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Last Updated: September 2026
            </span>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: "3rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 0.85rem",
              borderRadius: "100px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--glass-border)",
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              marginBottom: "1rem",
            }}
          >
            <Scale size={14} color="#6366f1" /> Legal Agreement
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using Outlio (&ldquo;the Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By accessing or using Outlio, you agree to be bound by these Terms.
          </p>
        </div>

        {/* Content Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", lineHeight: 1.7, fontSize: "0.95rem", color: "var(--text-secondary)" }}>
          
          {/* Section 1: Acceptance */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={18} /> 1. Acceptance of Terms & Eligibility
            </h2>
            <p>
              By accessing, browsing, or using Outlio, you confirm that you are at least 18 years of age (or have reached the age of majority in your jurisdiction) and possess the legal capacity to enter into a binding contract. If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          {/* Section 2: Description of the Service */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Globe size={18} /> 2. Description of the Service
            </h2>
            <p>
              Outlio provides software tools designed to assist job seekers in analyzing job posts, extracting hiring manager details, generating personalized job outreach emails, tailoring LaTeX resumes, and dispatching emails directly via Google OAuth (Gmail REST API) or SMTP credentials.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              You acknowledge that Outlio is a productivity assistant. You retain full discretion and responsibility for reviewing, modifying, and approving all generated email text and attachments prior to sending.
            </p>
          </section>

          {/* Section 3: Acceptable Use & Anti-Spam */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldAlert size={18} /> 3. Acceptable Use & Anti-Spam Policy
            </h2>
            <p>
              Outlio is intended strictly for genuine, 1-to-1 job applications and professional career outreach. You agree NOT to use the Service to:
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.75rem", marginBottom: "1rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>
                Send unsolicited bulk commercial email (spam), phishing attempts, scams, or fraudulent messages.
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                Harvest or scrape email addresses unlawfully or send messages to purchased email lists.
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                Impersonate any person or entity or misrepresent your credentials, qualifications, or identity.
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                Violate the terms of service of Google, LinkedIn, or any third-party communication platform.
              </li>
              <li>
                Transmit malware, viruses, or any harmful code via email attachments.
              </li>
            </ul>
            <div style={{ background: "var(--bg-tertiary)", padding: "1rem 1.25rem", borderRadius: "var(--radius-md)", borderLeft: "4px solid #ef4444" }}>
              <strong style={{ color: "#ef4444", display: "block", marginBottom: "0.35rem" }}>
                Zero Tolerance for Spam:
              </strong>
              <span>
                Violation of our Acceptable Use Policy will result in immediate termination of access to Outlio without notice.
              </span>
            </div>
          </section>

          {/* Section 4: Third-Party Integrations */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={18} /> 4. Third-Party Services & Google APIs
            </h2>
            <p>
              Outlio integrates with third-party providers, including Google (for authentication and Gmail API email dispatch) and AI inference APIs (such as OpenRouter / Google Gemini).
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.75rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>
                Your use of Google Sign-In and the Gmail API is subject to the{" "}
                <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-primary)", textDecoration: "underline" }}>
                  Google Terms of Service
                </a>.
              </li>
              <li>
                We are not liable for any downtime, rate limits, account restrictions, or modifications imposed by third-party platforms on your external accounts.
              </li>
            </ul>
          </section>

          {/* Section 5: Intellectual Property */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
              5. Intellectual Property
            </h2>
            <p>
              <strong>Your Content:</strong> You retain all intellectual property rights and ownership of your resume documents, personal information, cover letters, and communications created using the Service.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              <strong>Outlio IP:</strong> All code, interface designs, logos, software architecture, and documentation associated with Outlio are the exclusive intellectual property of Outlio.
            </p>
          </section>

          {/* Section 6: Disclaimers & Warranties */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertTriangle size={18} /> 6. Disclaimer of Warranties
            </h2>
            <p>
              Outlio is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express or implied.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              We make no guarantee that using Outlio will result in job interviews, job offers, recruiter responses, or employment. AI-generated text may occasionally contain inaccuracies; you are responsible for reviewing and verifying all generated emails prior to transmission.
            </p>
          </section>

          {/* Section 7: Limitation of Liability */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
              7. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, Outlio, its maintainers, affiliates, and developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, employment opportunities, or goodwill arising out of or related to your use of the Service.
            </p>
          </section>

          {/* Section 8: Changes to Terms */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
              8. Modifications to Terms
            </h2>
            <p>
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide notice by updating the &ldquo;Last Updated&rdquo; date on this page. Continued use of Outlio after changes become effective constitutes your acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 9: Contact */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
              9. Contact Information
            </h2>
            <p>
              For any inquiries or legal notices regarding these Terms of Service, please contact:
            </p>
            <p style={{ marginTop: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
              support@outlio.com
            </p>
          </section>

        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "3rem", paddingBottom: "2rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          &copy; {new Date().getFullYear()} Outlio. All rights reserved. &bull; <Link href="/privacy" style={{ color: "var(--text-secondary)", textDecoration: "underline" }}>Privacy Policy</Link>
        </div>

      </div>
    </div>
  );
}
