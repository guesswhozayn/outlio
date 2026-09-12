import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, RefreshCw, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Outlio",
  description: "Privacy Policy for Outlio. Understand how we access, use, store, and protect your Google and application data.",
};

export default function PrivacyPolicyPage() {
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
            <Shield size={14} color="#10b981" /> Legal & Transparency
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            At Outlio (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Service&rdquo;), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use Outlio.
          </p>
        </div>

        {/* Content Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", lineHeight: 1.7, fontSize: "0.95rem", color: "var(--text-secondary)" }}>
          
          {/* Section 1: Overview */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Eye size={18} /> 1. Overview & Core Philosophy
            </h2>
            <p>
              Outlio is an AI-powered job application outreach and resume tailoring tool. It enables job seekers to analyze job postings, craft personalized recruiter emails, tailor LaTeX resumes, and send applications directly through their personal Gmail accounts.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              <strong>We do not sell, rent, or monetize your personal data or email contents.</strong> Your application outreach is private, direct, and sent exclusively under your explicit command.
            </p>
          </section>

          {/* Section 2: Google User Data */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Lock size={18} /> 2. Google User Data & Permissions
            </h2>
            <p>
              When you choose to sign in with Google, Outlio requests the following permissions via Google OAuth:
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.75rem", marginBottom: "1rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>OpenID, Email, and Profile (`openid`, `email`, `profile`):</strong> Used solely to authenticate your identity, display your account email and profile name in the navigation header, and identify your user session.
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>Gmail Send Scope (`https://www.googleapis.com/auth/gmail.send`):</strong> Used exclusively to send application emails directly from your Gmail account when you click &ldquo;Send Application Email&rdquo;.
              </li>
            </ul>

            <div style={{ background: "var(--bg-tertiary)", padding: "1rem 1.25rem", borderRadius: "var(--radius-md)", borderLeft: "4px solid #10b981", marginTop: "1rem" }}>
              <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.35rem" }}>
                What Outlio NEVER does with your Google Account:
              </strong>
              <ul style={{ paddingLeft: "1.25rem", margin: 0, fontSize: "0.9rem" }}>
                <li>We <strong>never read</strong> your incoming emails (we do not request `gmail.readonly` or inbox read access).</li>
                <li>We <strong>never delete</strong>, search, or modify your existing email messages or folders.</li>
                <li>We <strong>never send</strong> any automated or background emails without your manual review and approval.</li>
                <li>We <strong>never share</strong> your Google account data or OAuth tokens with advertisers or third-party data brokers.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Google Limited Use Compliance */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={18} /> 3. Google API Services User Data Policy (Limited Use)
            </h2>
            <p>
              Outlio&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--text-primary)", textDecoration: "underline" }}
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements:
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.75rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>
                We only use Google User Data to provide user-facing features that are prominent in the Outlio application interface.
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                We do not transfer Google User Data to third parties, except as strictly necessary to provide the Service, comply with applicable laws, or as part of a merger/acquisition.
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                We do not use Google User Data for serving advertisements, including personalized, re-targeted, or interest-based advertising.
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                We do not allow humans to read Google User Data, except with your explicit affirmative agreement for specific troubleshooting or when required by law.
              </li>
              <li>
                We do not use Google User Data to train or fine-tune generalized artificial intelligence (AI) or machine learning (ML) models.
              </li>
            </ul>
          </section>

          {/* Section 4: Information You Provide Directly */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={18} /> 4. Information You Provide Directly
            </h2>
            <p>When configuring and utilizing Outlio, you may supply:</p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.75rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>User Profile:</strong> Full name, phone number, LinkedIn URL, GitHub profile, and portfolio links used to format your email signatures and resume header.
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>Resume Files & LaTeX Code:</strong> Uploaded PDF resumes and LaTeX template source code used to generate tailored PDF resumes.
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>Job Post Content:</strong> LinkedIn job posts, recruiter text, screenshots, or job requirements pasted for analysis.
              </li>
            </ul>
            <p style={{ marginTop: "0.75rem" }}>
              Your profile configurations, base resumes, and application logs are saved locally on your browser using client-side IndexedDB storage (`localforage`) or synchronized securely with encrypted user settings.
            </p>
          </section>

          {/* Section 5: AI Processing & Third-Party APIs */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <RefreshCw size={18} /> 5. AI Processing & Third-Party Providers
            </h2>
            <p>
              To analyze job postings, extract hiring manager contacts, and craft tailored cold outreach emails, Outlio interacts with third-party Large Language Model APIs (such as OpenRouter / Google Gemini / Anthropic / OpenAI):
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.75rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>
                Only the necessary job description snippets, user skills, and signature fields are transmitted to generate draft emails and tailor resumes.
              </li>
              <li>
                Data sent to AI inference endpoints is processed Ephemerally and is not used to train public models according to commercial API privacy terms.
              </li>
            </ul>
          </section>

          {/* Section 6: Data Retention & User Controls */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
              6. Data Retention, Deletion, and Revoking Access
            </h2>
            <p>
              You maintain total control over your data:
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.75rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>Revoke Google Access:</strong> You can disconnect Outlio&apos;s access to your Google account at any time by visiting{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--text-primary)", textDecoration: "underline" }}
                >
                  Google Account Third-party apps & services
                </a>.
              </li>
              <li style={{ marginBottom: "0.5rem" }}>
                <strong>Clear Local Data:</strong> You can wipe all stored resumes, application history, and custom settings by clearing your browser cache/storage or using the clear button in Settings.
              </li>
              <li>
                <strong>Sign Out:</strong> Logging out clears the current active OAuth session token from your browser session.
              </li>
            </ul>
          </section>

          {/* Section 7: Contact Us */}
          <section style={{ background: "var(--bg-secondary)", padding: "1.75rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
              7. Contact Us
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled, please reach out to us at:
            </p>
            <p style={{ marginTop: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
              support@outlio.com
            </p>
          </section>

        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "3rem", paddingBottom: "2rem", borderTop: "1px solid var(--glass-border)", paddingTop: "1.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          &copy; {new Date().getFullYear()} Outlio. All rights reserved. &bull; <Link href="/terms" style={{ color: "var(--text-secondary)", textDecoration: "underline" }}>Terms of Service</Link>
        </div>

      </div>
    </div>
  );
}
