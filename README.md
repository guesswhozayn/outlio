# Outlio

Outlio is an AI-powered job application outreach and resume tailoring assistant. Built on Next.js 16 (App Router), React 19, and the OpenRouter API, Outlio automates the entire pipeline of extracting job requirements from LinkedIn posts, URLs, or screenshots, dynamically tailoring master LaTeX resumes, compiling them into ATS-friendly PDFs, and dispatching personalized cold outreach emails directly through Gmail.

---

## Table of Contents

- [Overview](#overview)
- [Architecture & Directory Layout](#architecture--directory-layout)
- [Core Features](#core-features)
  - [Multi-Source Job Ingestion](#multi-source-job-ingestion)
  - [Intelligent Job Parsing & Multimodal Vision](#intelligent-job-parsing--multimodal-vision)
  - [Dynamic Resume Tailoring](#dynamic-resume-tailoring)
  - [In-Browser LaTeX PDF Compilation](#in-browser-latex-pdf-compilation)
  - [Personalized Email Outreach & Follow-Ups](#personalized-email-outreach--follow-ups)
  - [Secure Gmail Delivery Pipeline](#secure-gmail-delivery-pipeline)
  - [Hybrid Persistence Architecture](#hybrid-persistence-architecture)
- [Technology Stack](#technology-stack)
- [Progressive Web App (PWA) & Mobile Share Target](#progressive-web-app-pwa--mobile-share-target)
- [Environment Configuration](#environment-configuration)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Google OAuth & Gmail Configuration](#google-oauth--gmail-configuration)
- [Available Scripts](#available-scripts)
- [License](#license)

---

## Overview

Applying to competitive job openings often requires tedious manual effort: reviewing lengthy job specifications, tailoring resume bullet points to match target keywords, compiling LaTeX source files, locating hiring manager emails, and drafting customized outreach messages. 

Outlio unifies these steps into a fast, cohesive, and repeatable workflow accessible across both desktop browsers and mobile devices.

---

## Architecture & Directory Layout

Outlio is constructed using the Next.js App Router and combines modular client workbench tabs with focused serverless API routes:

```
outlio/
├── package.json               # Package manifest, dependencies, and scripts
├── next.config.mjs            # Next.js configuration
├── eslint.config.mjs          # ESLint configuration (Flat Config)
├── public/                    # Static brand assets, manifest icons, and PWA assets
└── src/
    ├── app/                   # Next.js App Router structure
    │   ├── layout.js          # Root layout with theme provider and navbar
    │   ├── page.js            # Main application workbench
    │   ├── globals.css        # Vanilla CSS design system (tokens, variables, utilities)
    │   ├── manifest.js        # Dynamic Web App Manifest for PWA installation
    │   ├── apple-icon.js      # Dynamic Apple touch icon generator
    │   ├── landing/           # Public marketing landing page
    │   ├── share-target/      # Web Share Target handler for incoming mobile shares
    │   └── api/               # Serverless API routes
    │       ├── auth/          # NextAuth authentication ([...nextauth])
    │       ├── compile-latex/ # LaTeX-to-PDF compilation proxy
    │       ├── fetch-linkedin/# Web scraper for LinkedIn job postings
    │       ├── models/        # Available OpenRouter models endpoint
    │       ├── parse/         # Multimodal LLM job description and screenshot parser
    │       ├── send/          # Gmail dispatcher (OAuth2 & App Password via Nodemailer)
    │       ├── settings/      # User settings persistence (Vercel KV / local KV fallback)
    │       └── tailor-resume/ # Resume customization engine
    ├── components/            # Reusable UI widgets and tabs
    │   ├── EmailPreviewTab.js # Outreach message composer and previewer
    │   ├── ExtractedFieldsTab.js # Structured job data viewer and editor
    │   ├── HistoryTab.js      # Past job application history log
    │   ├── JobInput.js        # URL submission, text paste, and screenshot upload
    │   ├── LandingPage.js     # Marketing hero, feature grid, and testimonials
    │   ├── Navbar.js          # Main navigation, auth state, and theme toggle
    │   ├── Providers.js       # Next-themes and NextAuth session providers
    │   ├── ServiceWorkerRegister.js # PWA service worker registration
    │   └── SettingsDrawer.js  # API key, model selection, profile, and credentials editor
    ├── hooks/                 # Custom React hooks
    │   └── useAutoMailer.js   # Central application state, storage, and workflow hook
    └── lib/                   # Shared utility modules
        ├── auth.js            # NextAuth configuration and Google OAuth provider
        └── openrouter.js      # OpenRouter API client with streaming and fallback
```

---

## Core Features

### Multi-Source Job Ingestion
- **Direct LinkedIn URL Fetching**: Automatically retrieves public job posting content from LinkedIn URLs via `/api/fetch-linkedin`.
- **Raw Text Description Intake**: Paste job descriptions or hiring posts directly into the workbench.
- **Job Screenshot Upload**: Upload PNG/JPEG images or screenshots of job listings for automated OCR and extraction.
- **Mobile Share Target**: Native PWA integration allowing users to share job postings directly from the LinkedIn mobile app into Outlio using the native device share sheet.

### Intelligent Job Parsing & Multimodal Vision
- Powered by OpenRouter models (supports text and vision-capable multimodal LLMs).
- Automatically extracts structured attributes into a clean JSON schema:
  - Recruiter / HR Email address
  - Company Name
  - Job Title (Position)
  - Recruiter / Hiring Team contact name
  - Core technologies, languages, and technical stack
  - Key requirements & core responsibilities
  - Comprehensive related skills for resume targeting

### Dynamic Resume Tailoring
- Maps candidate qualifications from a base LaTeX resume against the target job requirements.
- Automatically adjusts candidate headlines / professional titles to match the role.
- Reframes existing accomplishments and reorders experience bullet points to mirror target keywords without inventing fake credentials.
- Strictly preserves the structural integrity, styling, and preamble of your existing LaTeX template.

### In-Browser LaTeX PDF Compilation
- Compiles LaTeX source code directly into downloadable PDF files via `/api/compile-latex`.
- Sanitizes file naming to match candidate identity (e.g., `jane_doe_resume.pdf`).
- Eliminates the need for a local TeX Live or MacTeX installation.

### Personalized Email Outreach & Follow-Ups
- Composes tailored, high-converting outreach messages that avoid generic templates.
- **Two Modes**:
  - **Standard Application**: Expresses interest, highlights matching technical capabilities, and references specific responsibilities.
  - **Follow-Up**: Generates polite check-in messages referencing earlier submissions with re-attached resumes.
- In-browser editor allows instant manual tweaks before dispatching.

### Secure Gmail Delivery Pipeline
- Sends emails directly through Gmail using **Nodemailer**.
- **Two Authorization Options**:
  1. **Google OAuth2**: One-click Google Sign-In with automatic token refresh requesting the `https://www.googleapis.com/auth/gmail.send` scope.
  2. **Gmail App Password**: Enter your Gmail address and 16-character Google App Password in Settings.
- Supports both `application/json` payloads (with base64 resume encoding) and `multipart/form-data` uploads.
- Automatically attaches the tailored or base resume PDF.

### Hybrid Persistence Architecture
- **Client Storage (`localforage`)**: Stores base resume files (PDF/Blob), tailored resumes, and local application history in browser IndexedDB.
- **Server Storage (`@vercel/kv` & Local JSON Fallback)**: User profile settings (API keys, selected model, personal contact links, LaTeX template) persist to Vercel KV in production, or gracefully fallback to a local JSON file (`local_kv.json`) in local development when KV credentials are not set.

---

## Technology Stack

- **Framework**: [Next.js 16.2](https://nextjs.org/) (App Router, Turbopack)
- **Core Library**: [React 19.2](https://react.dev/), React DOM 19.2
- **Styling**: Modern Vanilla CSS design system with CSS custom properties and dark/light theme tokens
- **Authentication**: [NextAuth 4.24](https://next-auth.js.org/) (Google OAuth Provider with Gmail Send scope)
- **AI & Vision Orchestration**: [OpenRouter](https://openrouter.ai/) REST API
- **Local & Cloud Storage**: [LocalForage](https://localforage.github.io/localForage/) (IndexedDB), [Vercel KV](https://vercel.com/docs/storage/vercel-kv) (`@vercel/kv`)
- **Email Delivery**: [Nodemailer 7.0](https://nodemailer.com/) (Gmail OAuth2 & SMTP Transport)
- **Theming**: [Next Themes](https://github.com/pacocoursey/next-themes)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Progressive Web App (PWA) & Mobile Share Target

Outlio functions as an installable Progressive Web App:
- **Web App Manifest**: Configured dynamically via `src/app/manifest.js` with theme colors, display modes, and high-resolution icons.
- **Web Share Target API**: Declared in the manifest to intercept incoming links and text. When finding a job posting in the LinkedIn mobile app:
  1. Tap **Share** -> **More** -> select **Outlio**.
  2. The mobile browser opens `src/app/share-target/page.js`.
  3. Outlio automatically intercepts the incoming URL, extracts job specifications, and populates your workbench.
- **Service Worker**: Registered via `ServiceWorkerRegister.js` to enable shell caching.

---

## Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

| Variable | Required | Description | Example / Default |
| --- | --- | --- | --- |
| `OPENROUTER_API_KEY` | Optional* | OpenRouter API Key for AI operations (can also be entered in Settings) | `sk-or-v1-...` |
| `NEXTAUTH_SECRET` | **Yes** | Secret token for encrypting NextAuth session tokens | Run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | **Yes** | Canonical base URL for NextAuth authentication callbacks | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | **Yes** | Google Cloud OAuth Client ID (for Google Sign-In & Gmail dispatch) | `...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | **Yes** | Google Cloud OAuth Client Secret | `GOCSPX-...` |
| `KV_REST_API_URL` | Optional | Vercel KV REST API URL (falls back to local `local_kv.json` if omitted) | `https://...upstash.io` |
| `KV_REST_API_TOKEN` | Optional | Vercel KV REST API Token | `AX...` |

> *\* Note: If `OPENROUTER_API_KEY` is not provided in environment variables, users can supply their key via the in-app Settings Drawer.*

---

## Getting Started

### Prerequisites
- **Node.js**: `20.x` or higher
- **npm**: `9.x` or higher
- An **OpenRouter API Key** (from [openrouter.ai](https://openrouter.ai/))
- A **Google Cloud Project** with OAuth credentials

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

3. **Configure environment variables**:
   ```bash
   cp .env.example .env.local  # or create .env.local manually
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```

5. **Open the application**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

### Google OAuth & Gmail Configuration

To enable one-click Google Sign-In and automated email dispatch:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **Gmail API**.
3. Under **APIs & Services > Credentials**, configure an **OAuth 2.0 Client ID**:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: `http://localhost:3000` (and your production domain)
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google` (and your production callback)
4. Under **OAuth consent screen**, add the `https://www.googleapis.com/auth/gmail.send` scope.
5. Copy your Client ID and Client Secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`.

*(Alternatively, users who prefer not to use OAuth can enter a Google App Password directly in the in-app Settings drawer).*

---

## Available Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `npm run dev` | Runs the Next.js development server with Turbopack and IPv4 DNS order |
| `build` | `npm run build` | Compiles an optimized Next.js production build |
| `start` | `npm run start` | Starts the Next.js production server |
| `lint` | `npm run lint` | Runs ESLint across all files in `src/` |

---

## License

Private and Proprietary. All rights reserved.
