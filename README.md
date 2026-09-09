# Outlio

Outlio is an AI-powered job application outreach and resume tailoring assistant. Built on Next.js 16 (App Router), React 19, and the OpenRouter API, Outlio automates the process of extracting job requirements from LinkedIn or raw text, customizing master resumes, compiling LaTeX documents into PDF format, and generating personalized cold outreach emails for hiring managers.

## Table of Contents

- Overview
- Architecture and Directory Layout
- Core Features
- Technology Stack
- Progressive Web App (PWA) and Mobile Share Target
- AI Processing and OpenRouter Integration
- LaTeX Resume Compilation Pipeline
- Recruiter Email Outreach
- Environment Configuration
- Getting Started
- Available Scripts
- License

## Overview

Applying to competitive job openings often requires tedious manual effort: reading long job specifications, tailoring bullet points to match keywords, formatting resume documents, finding hiring manager emails, and drafting cold outreach messages. Outlio automates this entire pipeline into a cohesive, fast, and repeatable workflow accessible from both desktop browsers and mobile devices.

## Architecture and Directory Layout

Outlio is constructed using the Next.js App Router and utilizes modular client tabs paired with specialized serverless API endpoints:

```
outlio/
├── package.json               # Package manifest and scripts
├── next.config.mjs            # Next.js configuration
├── eslint.config.mjs          # ESLint configuration
├── public/                    # Static brand icons and manifest assets
└── src/
    ├── app/                   # App Router structure
    │   ├── layout.js          # Root layout with theme provider and navbar
    │   ├── page.js            # Main application workbench
    │   ├── globals.css        # Vanilla CSS design system (tokens, variables, utilities)
    │   ├── manifest.js        # Web App Manifest for PWA installation
    │   ├── apple-icon.js      # Dynamic Apple touch icon generator
    │   ├── landing/           # Public marketing landing page
    │   ├── share-target/      # Web Share Target handler for incoming mobile shares
    │   └── api/               # Serverless API routes
    │       ├── auth/          # NextAuth session routes
    │       ├── fetch-linkedin/# Web scraper extracting raw LinkedIn job details
    │       ├── parse/         # OpenRouter LLM job description parser
    │       ├── tailor-resume/ # Resume customization engine
    │       ├── compile-latex/ # LaTeX to PDF compilation service
    │       ├── send/          # Nodemailer email dispatcher
    │       ├── models/        # Available OpenRouter models endpoint
    │       └── settings/      # User configuration and credentials store
    ├── components/            # Reusable UI widgets and tabs
    │   ├── JobInput.js        # URL submission and raw description intake
    │   ├── ExtractedFieldsTab.js # Structured job data viewer
    │   ├── EmailPreviewTab.js # Outreach message composer and previewer
    │   ├── HistoryTab.js      # Past job application history log
    │   ├── LandingPage.js     # Marketing hero, feature grid, and testimonials
    │   ├── Navbar.js          # Main navigation and theme toggle
    │   ├── Providers.js       # Theme and session providers
    │   ├── ServiceWorkerRegister.js # PWA service worker registration
    │   └── SettingsDrawer.js  # API key, model selection, and profile editor
    ├── hooks/                 # Custom React hooks
    └── lib/                   # Shared utility modules
        ├── auth.js            # NextAuth configuration and providers
        └── openrouter.js      # OpenRouter API client with streaming and fallback
```

## Core Features

### Job Intake and Ingestion
- Direct URL Ingestion: Automatically retrieves job postings from LinkedIn via `/api/fetch-linkedin`.
- Manual Input: Paste raw text descriptions directly into the workbench.
- Mobile Share Target: Native PWA integration allowing users to share job postings directly from the LinkedIn mobile app into Outlio using their device share sheet.

### Intelligent Job Description Parsing
- Utilizes OpenRouter LLM models to analyze job postings.
- Extracts structured attributes: Company Name, Role Title, Seniority Level, Required Technical Skills, Preferred Qualifications, Compensation Ranges, and Company Mission.

### Dynamic Resume Tailoring
- Maps candidate qualifications from a master profile against the target job requirements.
- Emphasizes relevant keywords, reorders achievements to highlight matching experience, and generates custom LaTeX code tailored to applicant tracking systems (ATS).

### In-Browser LaTeX Compilation
- Compiles LaTeX documents directly into downloadable PDF files via `/api/compile-latex`.
- Ensures consistent typographical layout and formatting without requiring a local TeX distribution.

### Cold Outreach Email Generation
- Generates personalized, concise outreach emails targeted to recruiters and hiring managers.
- In-browser editor allows manual refinement before sending.
- Directly dispatches messages via configured SMTP servers using Nodemailer.

### Persistent Application History
- Tracks previous submissions, customized resumes, and sent outreach messages.
- Uses `localforage` for browser-side storage and `@vercel/kv` for server-side persistence.

## Technology Stack

- Framework: Next.js 16.2 (App Router)
- Core Library: React 19.2, React DOM 19.2
- Styling: Modern Vanilla CSS design system with CSS custom properties (no Tailwind dependency)
- Authentication: NextAuth 4.24
- AI and LLM Orchestration: OpenRouter REST API
- Local and Cloud Storage: LocalForage (IndexedDB/WebSQL), Vercel KV (`@vercel/kv`)
- Email Delivery: Nodemailer 7.0
- Themes: Next Themes
- Icons: Lucide React

## Progressive Web App (PWA) and Mobile Share Target

Outlio functions as an installable Progressive Web App:
- Web App Manifest: Configured dynamically via `src/app/manifest.js` with theme colors, display modes, and application icons.
- Web Share Target API: Declared in the manifest to intercept shared links and text. When a user finds a job posting in the LinkedIn mobile app, tapping "Share Via" and choosing "Outlio" passes the URL directly into `src/app/share-target/page.js`, which automatically fetches and parses the job.
- Service Worker: Registered via `ServiceWorkerRegister.js` to enable caching of static shell assets.

## AI Processing and OpenRouter Integration

The AI engine in `src/lib/openrouter.js` abstracts LLM operations:
- Model Versatility: Compatible with any model hosted on OpenRouter (e.g., Anthropic Claude 3.5 Sonnet, OpenAI GPT-4o, Meta Llama 3).
- Structured Output: Enforces strict JSON schemas for parsed job fields, ensuring predictable data bindings across the user interface.
- Configurable Settings: Users can supply their personal OpenRouter API key through the settings drawer or rely on server-configured credentials.

## LaTeX Resume Compilation Pipeline

1. The user profile and parsed job attributes are passed to `/api/tailor-resume`.
2. The model generates valid LaTeX source code adhering to established resume templates.
3. The source code is submitted to `/api/compile-latex`, which executes compilation and returns a binary PDF stream.
4. The client provides immediate inline previewing and direct download options.

## Recruiter Email Outreach

- Personalized Content: The prompt analyzes company culture and job specifics to compose professional outreach messages that avoid generic templates.
- SMTP Integration: Users can configure their own SMTP credentials (host, port, username, password) in the settings drawer.
- Dispatch: Nodemailer routes the message securely through the user's mail provider.

## Environment Configuration

Create a `.env.local` file in the root directory:

| Variable | Description | Example / Default |
| --- | --- | --- |
| OPENROUTER_API_KEY | OpenRouter API Key for AI operations | sk-or-v1-... |
| NEXTAUTH_SECRET | Secret token for NextAuth session encryption | your-nextauth-secret |
| NEXTAUTH_URL | Canonical base URL for NextAuth callbacks | http://localhost:3000 |
| KV_REST_API_URL | Vercel KV REST API endpoint (optional) | https://...upstash.io |
| KV_REST_API_TOKEN | Vercel KV REST API token (optional) | AX... |
| SMTP_HOST | Default SMTP server host for sending emails | smtp.gmail.com |
| SMTP_PORT | Default SMTP server port | 587 |
| SMTP_USER | Default SMTP username | your-email@gmail.com |
| SMTP_PASS | Default SMTP password or app password | your-app-password |

## Getting Started

### Prerequisites
- Node.js version 20.x or higher
- npm version 9.x or higher
- Valid OpenRouter API key

### Installation

1. Clone the repository and enter the directory:
   ```bash
   git clone <repository-url>
   cd outlio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` and add your `OPENROUTER_API_KEY`.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access `http://localhost:3000` in your web browser.

## Available Scripts

- `npm run dev`: Runs Next.js development server with `NODE_OPTIONS='--dns-result-order=ipv4first'`.
- `npm run build`: Compiles production build.
- `npm run start`: Starts Next.js production server.
- `npm run lint`: Validates code against ESLint rules across `src/`.

## License

This project is private and proprietary.
