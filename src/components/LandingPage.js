"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";

const comparisonRows = [
  {
    metric: "Time per application",
    oldWay: "30 minutes of writing & editing",
    outlio: "Under 15 seconds",
  },
  {
    metric: "The email",
    oldWay: "Long cover letters recruiters skim past",
    outlio: "Short, warm notes that get replies (< 65 words)",
  },
  {
    metric: "Your resume",
    oldWay: "Sending the exact same generic PDF",
    outlio: "Tailored to highlight relevant skills",
  },
  {
    metric: "Sending",
    oldWay: "Opening Gmail, copying, pasting, attaching",
    outlio: "1-click direct send from your inbox",
  },
  {
    metric: "On your phone",
    oldWay: "Impossible; save for later and forget",
    outlio: "Apply directly from the LinkedIn app",
  },
];

export default function LandingPage({ session }) {
  const { theme, setTheme } = useTheme();
  const [activeDemoStep, setActiveDemoStep] = useState(1);

  const demoSteps = [
    {
      id: 1,
      name: "1. Paste Any Job",
      shortName: "1. Paste",
      title: "Copy a link, paste text, or upload a screenshot",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              LinkedIn Job Post
            </span>
            <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "9999px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
              Job Detected
            </span>
          </div>
          <div
            style={{
              padding: "1rem",
              background: "var(--bg-primary)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.88rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            <p style={{ color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.35rem" }}>
              Senior Product Designer at Acme
            </p>
            <p>
              &ldquo;We&apos;re looking for a Senior Product Designer to help shape the future of our web products! Seeking someone skilled in design systems, user research, and prototyping. Send your portfolio and resume to sarah@acme.com.&rdquo;
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}
              onClick={() => setActiveDemoStep(2)}
            >
              Find Job Details
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      name: "2. Instant Details",
      shortName: "2. Details",
      title: "Contact and requirements found automatically",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <div style={{ padding: "0.85rem", background: "var(--bg-primary)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Company</div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>Acme</div>
            </div>
            <div style={{ padding: "0.85rem", background: "var(--bg-primary)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Role</div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>Senior Product Designer</div>
            </div>
            <div style={{ padding: "0.85rem", background: "var(--bg-primary)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Hiring Contact</div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>sarah@acme.com</div>
            </div>
          </div>

          <div style={{ padding: "0.85rem", background: "var(--bg-primary)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>Top Skills Looked For</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {["Design Systems", "User Research", "Interactive Prototyping", "Figma"].map((item) => (
                <span key={item} style={{ fontSize: "0.75rem", padding: "0.25rem 0.65rem", borderRadius: "var(--radius-sm)", background: "var(--bg-secondary)", border: "1px solid var(--glass-border)", color: "var(--text-primary)" }}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}
              onClick={() => setActiveDemoStep(3)}
            >
              Write My Email
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      name: "3. Short, Friendly Email",
      shortName: "3. Email",
      title: "A concise pitch recruiters actually read — under 65 words",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              padding: "1.1rem",
              background: "var(--bg-primary)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.86rem",
              lineHeight: 1.6,
              color: "var(--text-primary)",
            }}
          >
            <div style={{ color: "var(--text-muted)", marginBottom: "0.5rem", fontSize: "0.75rem" }}>
              Subject: Senior Product Designer Application — Alex Mercer
            </div>
            <p style={{ marginBottom: "0.6rem" }}>Hi Sarah,</p>
            <p style={{ marginBottom: "0.6rem" }}>
              Saw Acme&apos;s opening for Senior Product Designer and wanted to reach out directly.
            </p>
            <p style={{ marginBottom: "0.25rem", color: "var(--text-secondary)" }}>Where I can help immediately:</p>
            <ul style={{ margin: "0 0 0.6rem 1.2rem", color: "var(--text-secondary)" }}>
              <li>Scaling accessible, cross-platform design systems</li>
              <li>Fast user-testing and polished interactive prototypes</li>
            </ul>
            <p style={{ marginBottom: "0.6rem" }}>
              Attached my resume and portfolio. Do you have 10 minutes for a quick chat this week?
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
              Best,<br />
              Alex Mercer | +1 (555) 019-2834 | linkedin.com/in/alexmercer
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.65rem 0.9rem",
              background: "var(--bg-secondary)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
            }}
          >
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
              Attachment: alex_mercer_resume.pdf
            </span>
            <span style={{ color: "#10b981", fontSize: "0.75rem" }}>
              Tailored to Match This Job
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}
              onClick={() => setActiveDemoStep(4)}
            >
              Send with Gmail
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      name: "4. Sent in 1 Click",
      shortName: "4. Sent",
      title: "Delivered straight from your own Gmail",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", alignItems: "center", textAlign: "center", padding: "1rem 0" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
              fontSize: "1.4rem",
              fontWeight: 700,
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "0.25rem", color: "var(--text-primary)" }}>
              Email Sent Successfully!
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", maxWidth: "440px", lineHeight: 1.5 }}>
              Sent from your personal Gmail address to <code>sarah@acme.com</code> with your tailored resume attached. Zero copy-pasting, zero hassle.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}
              onClick={() => setActiveDemoStep(1)}
            >
              Try Another Job
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: "0.82rem", padding: "0.45rem 1rem" }}
              onClick={() => (session ? (window.location.href = "/") : signIn("google"))}
            >
              {session ? "Open Outlio Workspace" : "Get Started Free with Google"}
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="landing-page">
      <div className="landing-ambient-bg" aria-hidden="true" />

      <div className="landing-shell">
        {/* Navigation */}
        <header className="landing-nav">
          <Link href="/" className="landing-brand">
            <div className="nav-logo">
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.95rem" }}>O</span>
            </div>
            <span className="nav-title">Outlio</span>
          </Link>

          <nav>
            <ul className="landing-nav-links">
              <li>
                <a href="#demo" className="landing-nav-link">How It Looks</a>
              </li>
              <li>
                <a href="#features" className="landing-nav-link">Features</a>
              </li>
              <li>
                <a href="#how-it-works" className="landing-nav-link">How It Works</a>
              </li>
              <li>
                <a href="#phone" className="landing-nav-link">On Your Phone</a>
              </li>
              <li>
                <a href="#comparison" className="landing-nav-link">Comparison</a>
              </li>
              <li>
                <a href="#faq" className="landing-nav-link">FAQ</a>
              </li>
            </ul>
          </nav>

          <div className="landing-nav-actions">
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: "0.35rem 0.65rem", fontSize: "0.78rem" }}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle Theme"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>

            {session ? (
              <Link href="/" className="btn btn-primary" style={{ padding: "0.42rem 0.85rem", fontSize: "0.8rem", textDecoration: "none" }}>
                Open Workspace
              </Link>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: "0.42rem 0.85rem", fontSize: "0.8rem" }}
                onClick={() => signIn("google")}
              >
                Sign in with Google
              </button>
            )}
          </div>
        </header>

        {/* 1. Hero Section (Full Viewport Stage) */}
        <section className="landing-hero-screen">
          <h1 className="landing-title">
            Turn LinkedIn job posts into tailored applications in seconds.
          </h1>

          <p className="landing-subtitle">
            Found a great job on LinkedIn? Outlio finds the hiring contact, writes a short, friendly email that actually gets read, tailors your resume to match, and sends it directly from your Gmail in one click.
          </p>

          <div className="landing-cta-group">
            <div className="landing-cta-buttons">
              {session ? (
                <Link href="/" className="btn-hero-primary">
                  Open Outlio Workspace
                </Link>
              ) : (
                <button
                  type="button"
                  className="btn-hero-primary"
                  onClick={() => signIn("google")}
                >
                  Get Started Free with Google
                </button>
              )}
              <a href="#demo" className="btn-hero-secondary">
                See How It Works
              </a>
            </div>

            <div className="landing-trust">
              <span className="landing-trust-item">✓ Free to use</span>
              <span className="landing-trust-item">✓ No credit card needed</span>
              <span className="landing-trust-item">✓ Sends from your own email</span>
            </div>
          </div>
        </section>

        {/* 2. Interactive App Preview / Simulator (Full Viewport Stage) */}
        <section id="demo" className="landing-screen">
          <div className="section-header">
            <div className="section-tag">Interactive Preview</div>
            <h2 className="section-title">See Outlio in action</h2>
            <p className="section-desc">
              Click through the steps below to see how Outlio turns a job post into a sent application in seconds.
            </p>
          </div>

          <div className="preview-window">
            <div className="preview-window-bar">
              <div className="window-dots">
                <div className="window-dot" />
                <div className="window-dot" />
                <div className="window-dot" />
              </div>

              <div className="preview-step-tabs">
                {demoSteps.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`preview-step-tab ${activeDemoStep === s.id ? "active" : ""}`}
                    onClick={() => setActiveDemoStep(s.id)}
                  >
                    <span className="desktop-only">{s.name}</span>
                    <span className="mobile-only">{s.shortName}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="preview-content">
              <div style={{ marginBottom: "1.25rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.75rem" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  {demoSteps[activeDemoStep - 1].title}
                </h3>
              </div>
              {demoSteps[activeDemoStep - 1].content}
            </div>
          </div>
        </section>

        {/* 3. Features Bento Grid (Full Viewport Stage) */}
        <section id="features" className="landing-screen">
          <div className="section-header">
            <div className="section-tag">Features</div>
            <h2 className="section-title">Everything you need to land interviews faster</h2>
            <p className="section-desc">
              Designed to save you hours every week while helping you make a memorable first impression.
            </p>
          </div>

          <div className="landing-bento-grid">
            <article className="bento-card bento-col-8">
              <div>
                <span className="bento-badge">Instant Import</span>
                <h3 className="bento-title">Works with links, text, or screenshots</h3>
                <p className="bento-description">
                  Found a job listing? Simply paste the LinkedIn link, copy the text, or upload a screenshot. Outlio automatically finds the hiring manager, their email address, and the key requirements they care about most.
                </p>
              </div>
              <div className="bento-visual">
                <span style={{ color: "#10b981" }}>Job:</span> Senior Designer at Acme<br />
                <span style={{ color: "var(--text-muted)" }}>Contact:</span> sarah@acme.com<br />
                <span style={{ color: "var(--text-muted)" }}>Top Skills:</span> Design Systems, User Research, Prototyping
              </div>
            </article>

            <article className="bento-card bento-col-4">
              <div>
                <span className="bento-badge">Human & Short</span>
                <h3 className="bento-title">Emails people actually read</h3>
                <p className="bento-description">
                  Recruiters get hundreds of boring 500-word cover letters. Outlio writes short, thoughtful notes under 65 words that get straight to the point and start conversations.
                </p>
              </div>
              <div className="bento-visual" style={{ textAlign: "center", color: "var(--text-primary)", fontWeight: 600 }}>
                Average Read Time: <span style={{ color: "#10b981" }}>10 seconds</span>
              </div>
            </article>

            <article className="bento-card bento-col-4">
              <div>
                <span className="bento-badge">Smart Match</span>
                <h3 className="bento-title">Tailors your resume for every role</h3>
                <p className="bento-description">
                  Outlio highlights the exact skills and experience the hiring team is looking for, giving you a tailored PDF resume ready to attach to your email.
                </p>
              </div>
              <div className="bento-visual" style={{ color: "var(--text-secondary)" }}>
                Output: <code>resume_tailored.pdf</code><br />
                <span style={{ color: "#10b981" }}>✓ Matches job requirements</span>
              </div>
            </article>

            <article className="bento-card bento-col-8">
              <div>
                <span className="bento-badge">Direct Delivery</span>
                <h3 className="bento-title">Sends right from your Gmail</h3>
                <p className="bento-description">
                  No opening email tabs or copying and pasting. Click send, and your email goes out immediately from your own Gmail address with your tailored resume attached.
                </p>
              </div>
              <div className="bento-visual">
                <span style={{ color: "#10b981" }}>✓ Sent from:</span> your-email@gmail.com<br />
                <span style={{ color: "var(--text-muted)" }}>✓ Status:</span> Lands in the primary inbox
              </div>
            </article>

            <article className="bento-card bento-col-6">
              <div>
                <span className="bento-badge">Apply on the Go</span>
                <h3 className="bento-title">Save and apply right from your phone</h3>
                <p className="bento-description">
                  Browsing LinkedIn on your iPhone? Tap &ldquo;Share&rdquo; in the mobile app, choose Outlio, and your tailored email and resume are ready to review and send right on your phone.
                </p>
              </div>
              <div className="bento-visual">
                LinkedIn App ➔ Tap Share ➔ Outlio opens ready to send
              </div>
            </article>

            <article className="bento-card bento-col-6">
              <div>
                <span className="bento-badge">Your Data Stays Yours</span>
                <h3 className="bento-title">100% Private & Secure</h3>
                <p className="bento-description">
                  Your resume, emails, and job history stay securely in your own browser. We never sell your data, show ads, or spam anyone.
                </p>
              </div>
              <div className="bento-visual">
                <span style={{ color: "#10b981" }}>✓ Private:</span> Stored safely on your device
              </div>
            </article>
          </div>
        </section>

        {/* 4. How It Works Timeline (Full Viewport Stage) */}
        <section id="how-it-works" className="landing-screen">
          <div className="section-header">
            <div className="section-tag">How It Works</div>
            <h2 className="section-title">From finding a job to applied in 3 steps</h2>
            <p className="section-desc">
              Spend seconds applying instead of hours wrestling with clunky job portals.
            </p>
          </div>

          <div className="landing-steps">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3 className="step-title">Find a Job</h3>
              <p className="step-desc">
                Spot an open role on LinkedIn on your laptop or phone. Paste the link or tap Share to start.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <h3 className="step-title">Review Your Email</h3>
              <p className="step-desc">
                Outlio drafts a warm, personalized email and attaches your tailored resume. You can tweak any word.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <h3 className="step-title">Tap Send</h3>
              <p className="step-desc">
                Your email sends immediately from your own Gmail address. Done in under 30 seconds.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Phone / Mobile Showcase (Full Viewport Stage) */}
        <section id="phone" className="landing-screen">
          <div className="ios-showcase-section">
            <div>
              <span className="bento-badge">On Your Phone</span>
              <h2 style={{ fontSize: "1.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
                Apply while you scroll on your iPhone
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                Most people discover jobs while scrolling LinkedIn on their phone during a commute or break. With Outlio, you don&apos;t have to bookmark jobs for later or wait until you&apos;re at your computer.
              </p>

              <div className="ios-step-list">
                <div className="ios-step-item">
                  <span className="ios-step-index">1</span>
                  <div>
                    <strong>Add to Home Screen:</strong> Open Outlio in Safari, tap Share, and choose <em>Add to Home Screen</em>.
                  </div>
                </div>
                <div className="ios-step-item">
                  <span className="ios-step-index">2</span>
                  <div>
                    <strong>Add the Shortcut:</strong> Set up the simple 1-tap shortcut on your iPhone.
                  </div>
                </div>
                <div className="ios-step-item">
                  <span className="ios-step-index">3</span>
                  <div>
                    <strong>Share & Apply:</strong> When you see a post on LinkedIn, tap Share &rarr; Outlio, and your application is ready to review and send.
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.75rem 1.5rem",
                fontSize: "0.88rem",
              }}
            >
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>
                How it works on your phone:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                <div>
                  <strong style={{ color: "var(--text-primary)" }}>1.</strong> Tap <strong>Share</strong> on any LinkedIn post
                </div>
                <div>
                  <strong style={{ color: "var(--text-primary)" }}>2.</strong> Choose <strong>Outlio</strong> in the share menu
                </div>
                <div>
                  <strong style={{ color: "var(--text-primary)" }}>3.</strong> Outlio opens with your email and resume ready to send
                </div>
              </div>
              <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid var(--glass-border)", color: "#10b981", fontSize: "0.8rem", fontWeight: 500 }}>
                ✓ No waiting until you&apos;re at a desk · Apply anywhere
              </div>
            </div>
          </div>
        </section>

        {/* 6. Comparison Section (Full Viewport Stage) */}
        <section id="comparison" className="landing-screen comparison-container">
          <div className="section-header">
            <div className="section-tag">Comparison</div>
            <h2 className="section-title">The Old Way vs. With Outlio</h2>
            <p className="section-desc">
              See why job seekers are switching from painful application forms to direct outreach.
            </p>
          </div>

          {/* Desktop Table View */}
          <div className="comparison-table-wrapper desktop-only">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th style={{ width: "34%" }}>What you do</th>
                  <th style={{ width: "33%" }}>The Old Way</th>
                  <th style={{ width: "33%" }} className="outlio-col-header">With Outlio</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.metric}>
                    <td><strong>{row.metric}</strong></td>
                    <td><span className="badge-negative">{row.oldWay}</span></td>
                    <td><span className="badge-positive">{row.outlio}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="comparison-mobile-list mobile-only">
            {comparisonRows.map((row) => (
              <div key={row.metric} className="comparison-mobile-card">
                <div className="comparison-metric-title">{row.metric}</div>
                <div className="comparison-side-by-side">
                  <div className="comparison-box old-box">
                    <span className="comparison-box-label">The Old Way</span>
                    <span className="comparison-box-val">{row.oldWay}</span>
                  </div>
                  <div className="comparison-box new-box">
                    <span className="comparison-box-label">With Outlio</span>
                    <span className="comparison-box-val">{row.outlio}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. FAQ Section (Full Viewport Stage) */}
        <section id="faq" className="landing-screen faq-container">
          <div className="section-header">
            <div className="section-tag">FAQ</div>
            <h2 className="section-title">Frequently asked questions</h2>
            <p className="section-desc">
              Everything you need to know about getting started with Outlio.
            </p>
          </div>

          <div className="faq-list">
            <details className="faq-item" open>
              <summary className="faq-question">
                <span>Is Outlio free to use?</span>
                <span className="faq-toggle-icon">+</span>
              </summary>
              <div className="faq-answer">
                Yes! Outlio is completely free to use. There are no credit cards required, no trial periods, and no surprise charges.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question">
                <span>How does Gmail sending work? Is my account safe?</span>
                <span className="faq-toggle-icon">+</span>
              </summary>
              <div className="faq-answer">
                Yes, 100%. Outlio connects securely with Google so the email sends from your own Gmail address. This ensures your emails look authentic, land in the recruiter&apos;s primary inbox, and replies go directly back to you.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question">
                <span>Can I review and edit the email before sending?</span>
                <span className="faq-toggle-icon">+</span>
              </summary>
              <div className="faq-answer">
                Always. Outlio creates a smart draft, but you have full control. You can change the subject line, edit any sentence, or update the recipient email before clicking Send.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question">
                <span>How does resume tailoring work?</span>
                <span className="faq-toggle-icon">+</span>
              </summary>
              <div className="faq-answer">
                Outlio reads the skills and qualifications the hiring manager is looking for, highlights your matching experience, and attaches a clean, professional PDF to your email.
              </div>
            </details>

            <details className="faq-item">
              <summary className="faq-question">
                <span>How do I use it on my iPhone?</span>
                <span className="faq-toggle-icon">+</span>
              </summary>
              <div className="faq-answer">
                Simply open Outlio in Safari, tap Share, and choose &ldquo;Add to Home Screen&rdquo;. You can also set up our simple Apple Shortcut to share jobs directly from the LinkedIn app into Outlio.
              </div>
            </details>
          </div>
        </section>

        {/* 8. Bottom CTA & Footer (Full Viewport Stage) */}
        <section className="landing-cta-footer-screen">
          <div className="landing-bottom-cta">
            <h2 className="bottom-cta-title">
              Stop losing hours to applications nobody reads.
            </h2>
            <p className="bottom-cta-desc">
              Send warm, personalized emails and tailored resumes in seconds. Your next opportunity is just one click away.
            </p>

            <div style={{ marginTop: "0.5rem" }}>
              {session ? (
                <Link href="/" className="btn-hero-primary">
                  Open Outlio Workspace
                </Link>
              ) : (
                <button
                  type="button"
                  className="btn-hero-primary"
                  onClick={() => signIn("google")}
                >
                  Get Started Free with Google
                </button>
              )}
            </div>
          </div>

          <footer className="landing-footer">
            <div className="footer-top">
              <Link href="/" className="landing-brand">
                <div className="nav-logo">
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.95rem" }}>O</span>
                </div>
                <span className="nav-title">Outlio</span>
              </Link>

              <div className="footer-links">
                <a href="#demo" className="footer-link">Demo</a>
                <a href="#features" className="footer-link">Features</a>
                <a href="#how-it-works" className="footer-link">How It Works</a>
                <a href="#phone" className="footer-link">On Your Phone</a>
                <a href="#comparison" className="footer-link">Comparison</a>
                <a href="#faq" className="footer-link">FAQ</a>
                <Link href="/privacy" className="footer-link">Privacy</Link>
                <Link href="/terms" className="footer-link">Terms</Link>
              </div>
            </div>

            <div className="footer-bottom">
              <div>
                &copy; {new Date().getFullYear()} Outlio. The effortless way to apply for jobs. &bull; <Link href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>Privacy Policy</Link> &bull; <Link href="/terms" style={{ color: "inherit", textDecoration: "underline" }}>Terms of Service</Link>
              </div>

              <div className="status-badge">
                <span className="status-indicator-dot" />
                <span>All Systems Operational</span>
              </div>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
