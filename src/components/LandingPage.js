"use client";

import { useState } from "react";
import {
  Sun,
  Moon,
  ArrowRight,
  FileText,
  Code2,
  Send,
  KeyRound,
  MailCheck,
  Database,
  Check,
} from "lucide-react";
import OutlioLogo from "./OutlioLogo";

const PIPELINE_STEPS = [
  {
    id: "extract",
    label: "Extract",
    icon: FileText,
    meta: "Input: LinkedIn post or screenshot",
    inputTitle: "Raw job post",
    inputContent: `Hiring a Senior Full-Stack Engineer at Raycast (Remote, US/EU).
We work with TypeScript, React, Node.js, PostgreSQL, and Redis.
You will own end-to-end product features and API performance.
Send your resume and GitHub directly to jobs@raycast.com (Sarah Chen, Eng Manager).`,
    outputTitle: "Extracted fields",
    outputItems: [
      { label: "Recipient", value: "jobs@raycast.com (Sarah Chen)" },
      { label: "Role", value: "Senior Full-Stack Engineer" },
      { label: "Company", value: "Raycast" },
      { label: "Matched stack", value: "TypeScript, React, Node.js, PostgreSQL, Redis" },
    ],
  },
  {
    id: "tailor",
    label: "Tailor",
    icon: Code2,
    meta: "Output: Compiled ATS PDF",
    inputTitle: "LaTeX source diff",
    inputContent: `\\section*{Experience}
\\textbf{Senior Software Engineer} \\hfill 2023 -- Present
\\begin{itemize}[noitemsep,topsep=0pt]
- \\item Built full-stack web features and internal tools.
+ \\item Owned end-to-end TypeScript and React features, cutting API p95 delay by 38\\% with Redis caching.
  \\item Designed PostgreSQL schemas and Node.js background workers handling 4M daily jobs.
\\end{itemize}`,
    outputTitle: "Compiler output",
    outputItems: [
      { label: "Document", value: "Alex_Rivera_Resume.pdf (1 page)" },
      { label: "Keywords aligned", value: "TypeScript, React, Node.js, PostgreSQL, Redis" },
      { label: "Format", value: "Compiled from your master LaTeX template" },
      { label: "Status", value: "Attached to outreach draft" },
    ],
  },
  {
    id: "send",
    label: "Send",
    icon: Send,
    meta: "Under 65 words · Direct SMTP",
    inputTitle: "Outreach email preview",
    inputContent: `To: jobs@raycast.com
Subject: Application for Senior Full-Stack Engineer - Alex Rivera

Hi Sarah,

I saw your post for the Senior Full-Stack Engineer role at Raycast. I have 5+ years building production apps with TypeScript, React, Node.js, and PostgreSQL, recently cutting API delay by 38% using Redis.

I attached my resume and linked my GitHub below. Happy to chat this week.

Best,
Alex Rivera`,
    outputTitle: "Dispatch details",
    outputItems: [
      { label: "Word count", value: "58 words (under the 65-word recruiter threshold)" },
      { label: "Attachment", value: "Alex_Rivera_Resume.pdf" },
      { label: "Delivery", value: "Sent directly through Gmail SMTP" },
      { label: "Follow-up", value: "Saved to History for 1-click follow-up" },
    ],
  },
];

const WORKFLOW_CARDS = [
  {
    step: "01",
    title: "Extract from text or screenshot",
    description:
      "Paste a raw LinkedIn post or upload a screenshot. OpenRouter AI pulls the recruiter email, hiring manager name, role title, and technical requirements.",
  },
  {
    step: "02",
    title: "Rewrite and compile your LaTeX resume",
    description:
      "Outlio updates your master LaTeX resume to match the job's stack and compiles a clean PDF in the browser without breaking your layout.",
  },
  {
    step: "03",
    title: "Send concise emails from your Gmail",
    description:
      "Generate a direct email under 65 words with your PDF attached. Send in one click and follow up later from your application history.",
  },
];

const ARCHITECTURE_ITEMS = [
  {
    icon: KeyRound,
    title: "Multi-model OpenRouter AI",
    description:
      "Automatic routing across vision and text models extracts job details from posts or screenshots and tailors your resume.",
  },
  {
    icon: MailCheck,
    title: "Direct Gmail Delivery",
    description:
      "Emails go out securely from your personal Gmail address with custom font styling, signature links, and your tailored PDF attached.",
  },
  {
    icon: Database,
    title: "Browser and cloud persistence",
    description:
      "Compiled PDFs and sent history stay in local browser storage, while your LaTeX template and signature sync across devices.",
  },
];

export default function LandingPage({ mounted, theme, setTheme, onLaunchApp }) {
  const [activeStepId, setActiveStepId] = useState(PIPELINE_STEPS[0].id);

  const activeStep =
    PIPELINE_STEPS.find((step) => step.id === activeStepId) ?? PIPELINE_STEPS[0];

  return (
    <div className="landing-shell">
      <header className="floating-nav landing-nav">
        <div className="logo-section">
          <OutlioLogo size={32} bg="#000000" shape="circle" />
          <span className="nav-title">Outlio</span>
        </div>

        <nav className="nav-actions" aria-label="Primary">
          {mounted && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          <button
            type="button"
            className="btn btn-primary landing-nav-btn"
            onClick={onLaunchApp}
          >
            Launch App
          </button>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero-section" aria-labelledby="hero-heading">
          <h1 id="hero-heading" className="hero-title">
            Turn job posts into tailored applications in seconds.
          </h1>

          <p className="hero-subtitle">
            Paste a LinkedIn job post or upload a screenshot. Outlio extracts the hiring
            contact, tailors your LaTeX resume into a PDF, and sends a concise email
            directly from your Gmail account.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary hero-cta-primary"
              onClick={onLaunchApp}
            >
              <span>Get Started</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </section>

        <section className="showcase-section" aria-label="Interactive pipeline preview">
          <div className="showcase-window">
            <div className="showcase-chrome">
              <div className="showcase-dots" aria-hidden="true">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="showcase-address">
                <span>outlio.app/pipeline</span>
              </div>
              <span className="showcase-badge">
                <span className="badge-pulse" />
                <span>AI Pipeline</span>
              </span>
            </div>

            <div className="showcase-toolbar" role="tablist" aria-label="Application steps">
              <div className="showcase-tabs">
                {PIPELINE_STEPS.map((step) => {
                  const Icon = step.icon;
                  const isSelected = step.id === activeStep.id;
                  return (
                    <button
                      key={step.id}
                      type="button"
                      role="tab"
                      id={`tab-${step.id}`}
                      aria-selected={isSelected}
                      aria-controls={`panel-${step.id}`}
                      className={`showcase-tab ${isSelected ? "active" : ""}`}
                      onClick={() => setActiveStepId(step.id)}
                    >
                      <Icon size={14} aria-hidden="true" />
                      <span>{step.label}</span>
                    </button>
                  );
                })}
              </div>
              <span className="showcase-meta">{activeStep.meta}</span>
            </div>

            <div
              id={`panel-${activeStep.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeStep.id}`}
              className="showcase-grid"
            >
              <div className="showcase-pane">
                <div className="showcase-pane-header">
                  <span>{activeStep.inputTitle}</span>
                </div>
                <pre className="showcase-code">{activeStep.inputContent}</pre>
              </div>

              <div className="showcase-pane">
                <div className="showcase-pane-header">
                  <span>{activeStep.outputTitle}</span>
                </div>
                <ul className="showcase-list">
                  {activeStep.outputItems.map((item) => (
                    <li key={item.label} className="showcase-list-item">
                      <span className="showcase-item-label">{item.label}</span>
                      <span className="showcase-item-value">
                        <Check size={14} className="showcase-check" aria-hidden="true" />
                        <span>{item.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="workflow-heading">
          <div className="section-header">
            <span className="section-eyebrow">Workflow</span>
            <h2 id="workflow-heading" className="section-title">
              From raw listing to sent application in three steps
            </h2>
          </div>

          <div className="workflow-grid">
            {WORKFLOW_CARDS.map((card) => (
              <article key={card.step} className="workflow-card">
                <span className="workflow-step">{card.step}</span>
                <h3 className="workflow-title">{card.title}</h3>
                <p className="workflow-desc">{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" aria-labelledby="architecture-heading">
          <div className="section-header">
            <span className="section-eyebrow">Architecture</span>
            <h2 id="architecture-heading" className="section-title">
              Built for direct outreach under your control
            </h2>
          </div>

          <div className="architecture-grid">
            {ARCHITECTURE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="architecture-card">
                  <div className="architecture-icon">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <div className="architecture-body">
                    <h3 className="architecture-title">{item.title}</h3>
                    <p className="architecture-desc">{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="cta-banner" aria-labelledby="cta-heading">
          <div className="cta-copy">
            <h2 id="cta-heading" className="cta-title">
              Ready to send your next application?
            </h2>
            <p className="cta-desc">
              Get started with zero setup, paste your LaTeX template, and compile
              your first tailored resume in seconds.
            </p>
          </div>
          <div className="cta-actions">
            <button
              type="button"
              className="btn btn-primary hero-cta-primary"
              onClick={onLaunchApp}
            >
              <span>Get Started</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="logo-section">
          <OutlioLogo size={22} bg="#000000" shape="circle" />
          <span className="footer-brand">Outlio</span>
        </div>
        <p className="footer-note">
          AI job extraction, LaTeX resume tailoring, and direct Gmail outreach.
        </p>
      </footer>
    </div>
  );
}
