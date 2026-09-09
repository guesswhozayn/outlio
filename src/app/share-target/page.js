"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Share2, CheckCircle2 } from "lucide-react";

function ShareTargetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Ingesting shared post from LinkedIn...");
  const [step, setStep] = useState(1);

  useEffect(() => {
    async function processSharedData() {
      const title = searchParams.get("title") || "";
      const text = searchParams.get("text") || "";
      const url = searchParams.get("url") || "";

      // If no parameters at all, just redirect to home
      if (!title && !text && !url) {
        router.replace("/");
        return;
      }

      try {
        setStatus("Resolving LinkedIn post & job description...");
        setStep(2);

        const res = await fetch("/api/fetch-linkedin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, text, url }),
        });

        const data = await res.json();
        const resolvedText = data.text || [title, text, url].filter(Boolean).join("\n\n");

        // Save into localStorage for useAutoMailer to pick up
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "outlio_shared_job",
            JSON.stringify({
              text: resolvedText,
              rawTitle: title,
              rawUrl: url,
              source: data.source || "shared_target",
              timestamp: Date.now(),
            })
          );
          sessionStorage.setItem("outlio_trigger_auto_parse", "true");
        }

        setStatus("Job loaded! Transferring to Outlio workspace...");
        setStep(3);

        // Small timeout for smooth visual transition
        setTimeout(() => {
          router.replace("/?shared=true");
        }, 500);
      } catch (err) {
        console.warn("Error processing shared target:", err);
        const fallbackText = [title, text, url].filter(Boolean).join("\n\n");
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "outlio_shared_job",
            JSON.stringify({
              text: fallbackText,
              rawTitle: title,
              rawUrl: url,
              source: "fallback",
              timestamp: Date.now(),
            })
          );
          sessionStorage.setItem("outlio_trigger_auto_parse", "true");
        }
        router.replace("/?shared=true");
      }
    }

    processSharedData();
  }, [searchParams, router]);

  return (
    <div
      className="app-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "1.5rem",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          padding: "2.5rem 2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "var(--surface-active, #1a1d26)",
            border: "1px solid var(--border-color, #2d3343)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-primary, #6366f1)",
          }}
        >
          {step === 3 ? (
            <CheckCircle2 size={28} style={{ color: "var(--success, #10b981)" }} />
          ) : (
            <Share2 size={26} />
          )}
        </div>

        <div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginBottom: "0.5rem",
              fontFamily: "var(--font-mono)",
            }}
          >
            LinkedIn Post Shared
          </h2>
          <p
            style={{
              color: "var(--text-secondary, #94a3b8)",
              fontSize: "0.875rem",
              lineHeight: 1.5,
            }}
          >
            {status}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Loader2
            size={18}
            className="animate-spin"
            style={{
              animation: "spin 1s linear infinite",
              color: "var(--accent-primary, #6366f1)",
            }}
          />
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #64748b)" }}>
            Preparing AI Extractor...
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ShareTargetPage() {
  return (
    <Suspense
      fallback={
        <div
          className="app-container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <div className="spinner spinner-lg"></div>
        </div>
      }
    >
      <ShareTargetContent />
    </Suspense>
  );
}
