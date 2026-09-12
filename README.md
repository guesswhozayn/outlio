# Outlio

Outlio is a streamlined, AI-powered job application outreach and resume tailoring assistant built with Next.js 16 (App Router), React 19, and OpenRouter API. It automates the workflow of extracting job requirements from posts or screenshots, tailoring master LaTeX resumes, compiling them into ATS-friendly PDFs, and dispatching concise cold outreach emails directly through your connected Gmail account.

---

## Table of Contents

- [Overview](#overview)
- [Architecture & Directory Layout](#architecture--directory-layout)
- [Core Features](#core-features)
  - [Multimodal Job Extraction](#multimodal-job-extraction)
  - [Dynamic LaTeX Resume Tailoring & PDF Compilation](#dynamic-latex-resume-tailoring--pdf-compilation)
  - [Ultra-Concise Outreach Emails & Follow-Ups](#ultra-concise-outreach-emails--follow-ups)
  - [Direct Gmail Integration](#direct-gmail-integration)
  - [Instant View Switching & User Preview Mode](#instant-view-switching--user-preview-mode)
  - [Hybrid Browser & Cloud Persistence](#hybrid-browser--cloud-persistence)
- [Technology Stack](#technology-stack)
- [Environment Configuration](#environment-configuration)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Google OAuth Setup](#google-oauth-setup)
- [Available Scripts](#available-scripts)
- [License](#license)

---

## Overview

Job searching often involves repetitive manual tasks: extracting recruiter emails, tweaking resume bullet points for ATS keywords, building LaTeX files, and writing cold emails.

Outlio consolidates these steps into a unified workbench:
1. **Paste or Upload**: Supply a job description or screenshot of a job post.
2. **Extract & Preview**: Outlio's AI parses recruiter contact details and generates a concise outreach email.
3. **Send via Gmail**: Click **Send** to dispatch your application directly through your connected Gmail account.

---

## Architecture & Directory Layout

```
outlio/
├── package.json               # Package manifest and scripts
├── next.config.mjs            # Next.js configuration
├── eslint.config.mjs          # ESLint configuration
├── public/                    # Static assets, PWA icons, and service worker
└── src/
    ├── app/                   # Next.js App Router
    │   ├── layout.js          # Root layout with providers
    │   ├── page.js            # Main application workbench
    │   ├── globals.css        # Modern vanilla CSS design system & tokens
    │   ├── manifest.js        # Web App Manifest
    │   ├── apple-icon.js      # Dynamic Apple touch icon
    │   └── api/               # Serverless API routes
    │       ├── auth/          # NextAuth OAuth handler ([...nextauth])
    │       ├── compile-latex/ # LaTeX-to-PDF compilation service
    │       ├── models/        # OpenRouter model discovery endpoint
    │       ├── parse/         # Multimodal LLM job extractor
    │       ├── send/          # Gmail REST API email dispatcher
    │       ├── settings/      # User settings persistence endpoint
    │       └── tailor-resume/ # AI resume customization engine
    ├── components/            # Reusable UI components & drawers
    │   ├── EmailPreviewTab.js # Email composer & preview workbench
    │   ├── ExtractedFieldsTab.js # Extracted job attributes editor
    │   ├── HelpDrawer.js      # Quick guide drawer
    │   ├── HistoryTab.js      # Application history log & follow-up generator
    │   ├── JobInput.js        # Job description text & screenshot intake
    │   ├── Navbar.js          # Main navigation bar with theme & auth controls
    │   ├── Providers.js       # NextAuth & theme providers
    │   ├── ServiceWorkerRegister.js # PWA service worker initializer
    │   └── SettingsDrawer.js  # Signature profile & LaTeX resume settings
    ├── hooks/                 # Custom React hooks
    │   └── useAutoMailer.js   # Application workbench state & logic
    └── lib/                   # Utility helpers
        ├── auth.js            # NextAuth configuration with Gmail OAuth scopes
        └── openrouter.js      # OpenRouter API client & fallback models
```

---

## Core Features

### Multimodal Job Extraction
- **Text & Screenshot Intake**: Paste raw job post text or upload listing screenshots for AI extraction.
- **Structured Parsing**: Automatically extracts recruiter email, position title, company name, hiring manager name, core tech stack, and key requirements.

### Dynamic LaTeX Resume Tailoring & PDF Compilation
- **AI Resume Customization**: Dynamically aligns qualifications and experience bullets in your LaTeX template with job requirements.
- **In-Browser PDF Compilation**: Compiles LaTeX source code directly to a clean PDF resume attached to your email.

### Ultra-Concise Outreach Emails & Follow-Ups
- **Concise Templates**: Automatically generates short, impactful outreach emails formatted as `Application for [Job Title] – [Your Name]`.
- **Follow-Up Generator**: Re-engage recruiters from the **History** tab with polite follow-up emails and re-attached resumes.

### Direct Gmail Integration
- **Google OAuth Session Dispatch**: Applications are sent directly through Gmail REST API using your authenticated Google account session.

### Instant View Switching & User Preview Mode
- **View Toggle**: Switch between Job Description input and Email Preview with a single click (`<ArrowLeftRight />`).
- **Visitor Preview Mode**: Unauthenticated visitors can explore the full UI; performing actions seamlessly prompts Google Sign-In.

### Hybrid Browser & Cloud Persistence
- **Client Storage (`localforage`)**: PDF resumes and history logs persist securely in browser IndexedDB.
- **Settings Persistence**: User signature details and LaTeX templates persist across devices via settings storage.

---

## Technology Stack

- **Framework**: [Next.js 16.2](https://nextjs.org/) (App Router, Turbopack)
- **Core**: [React 19.2](https://react.dev/), JavaScript
- **Styling**: Vanilla CSS Design System with dark/light themes & glassmorphism
- **Auth & API**: [NextAuth 4.24](https://next-auth.js.org/) with Google OAuth & Gmail REST API
- **AI Engine**: [OpenRouter API](https://openrouter.ai/) (Vision & Text LLMs)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Environment Configuration

Create `.env.local` in the root directory:

```env
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
OPENROUTER_API_KEY="your-openrouter-api-key"
```

---

## Getting Started

### Prerequisites
- **Node.js**: `20.x` or higher
- **npm**: `9.x` or higher

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/guesswhozayn/outlio.git
   cd outlio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure `.env.local`**:
   Populate your `.env.local` file with the environment variables listed above.

4. **Start local development server**:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

---

## Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **Gmail API**.
3. Create an **OAuth 2.0 Client ID** (Web application).
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
4. Add the `https://www.googleapis.com/auth/gmail.send` scope in the OAuth consent screen.
5. Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`.

---

## Available Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `npm run dev` | Runs the Next.js development server with Turbopack |
| `build` | `npm run build` | Compiles an optimized production build |
| `start` | `npm run start` | Starts the production server |
| `lint` | `npm run lint` | Runs ESLint across all source files |

---

## License

Private and Proprietary. All rights reserved.
