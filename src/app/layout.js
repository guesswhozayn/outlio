import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "../components/Providers";
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport = {
  themeColor: "#111115",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata = {
  title: "Outlio — AI Job Application Outreach & Resume Tailoring",
  description: "Turn LinkedIn job posts into tailored applications in seconds. AI deep extraction, recruiter-proven emails under 65 words, automated LaTeX resume tailoring, and 1-click Gmail sending.",
  keywords: ["AI job applications", "LinkedIn post extractor", "resume tailoring", "cold email outreach", "Gmail 1-click apply", "job hunter tool"],
  authors: [{ name: "Outlio" }],
  openGraph: {
    title: "Outlio — AI Job Application Outreach & Resume Tailoring",
    description: "Turn LinkedIn job posts into tailored applications in seconds with automated resume tailoring and 1-click Gmail dispatch.",
    url: "https://outlioai.vercel.app",
    siteName: "Outlio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Outlio — AI Job Application Outreach & Resume Tailoring",
    description: "Turn LinkedIn job posts into tailored applications in seconds with automated resume tailoring and 1-click Gmail dispatch.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Outlio",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

