export const DEFAULT_MODEL = "openrouter/free";

export const FALLBACK_FREE_MODELS = [
  { name: "openrouter/free", displayName: "Auto (Best Available)", isVision: true },
  { name: "google/gemma-4-31b-it:free", displayName: "Google: Gemma 4 31B", isVision: true },
  { name: "google/gemma-4-26b-a4b-it:free", displayName: "Google: Gemma 4 26B A4B", isVision: true },
  { name: "nvidia/nemotron-3.5-lightning:free", displayName: "NVIDIA: Nemotron 3.5 Lightning", isVision: false },
  { name: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", displayName: "NVIDIA: Nemotron 3 Nano Omni", isVision: true },
  { name: "nvidia/nemotron-3-ultra-550b-a55b:free", displayName: "NVIDIA: Nemotron 3 Ultra", isVision: false },
  { name: "dots-studio/dots-3-note-preview:free", displayName: "Dots Studio: Dots3-Note Preview", isVision: true },
  { name: "thinkingmachines/inkling:free", displayName: "Thinking Machines: Inkling", isVision: true },
  { name: "poolside/laguna-s-2.1:free", displayName: "Poolside: Laguna S 2.1", isVision: false },
  { name: "cohere/north-mini-code:free", displayName: "Cohere: North Mini Code", isVision: false },
];

export async function fetchFreeModels() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        ...(process.env.OPENROUTER_API_KEY ? { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } : {}),
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return FALLBACK_FREE_MODELS;
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.data)) {
      return FALLBACK_FREE_MODELS;
    }

    const freeModels = data.data
      .filter((m) => {
        const id = m.id || "";
        const isFreeId = id === "openrouter/free" || id.endsWith(":free");
        const isFreePrice =
          m.pricing &&
          Number(m.pricing.prompt) === 0 &&
          Number(m.pricing.completion) === 0;
        return isFreeId || isFreePrice;
      })
      .map((m) => {
        let displayName = m.name || m.id;
        if (m.id === "openrouter/free") {
          displayName = "Auto (Best Available)";
        } else {
          displayName = displayName.replace(/\s*\(free\)/gi, "").trim();
        }
        return {
          name: m.id,
          displayName,
          contextLength: m.context_length || 0,
          isVision: m.architecture?.input_modalities?.includes("image") ?? false,
        };
      });

    if (freeModels.length === 0) {
      return FALLBACK_FREE_MODELS;
    }

    // Ensure openrouter/free is at the very top
    freeModels.sort((a, b) => {
      if (a.name === "openrouter/free") return -1;
      if (b.name === "openrouter/free") return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    return freeModels;
  } catch (error) {
    console.error("Failed to fetch OpenRouter models:", error);
    return FALLBACK_FREE_MODELS;
  }
}

export async function chatCompletion({ model = DEFAULT_MODEL, messages, maxRetries = 2 }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in .env.local.");
  }

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    const currentModel = attempt > 0 && model !== DEFAULT_MODEL ? DEFAULT_MODEL : model;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
          "X-Title": "AutoMailer",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const message = data.error?.message || `OpenRouter API error (status ${response.status})`;
        const isUnavailable = response.status === 503 || response.status === 429 || message.toLowerCase().includes("busy") || message.toLowerCase().includes("rate limit") || message.toLowerCase().includes("demand");
        if (attempt < maxRetries && isUnavailable) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        throw new Error(message);
      }

      const content = data.choices?.[0]?.message?.content;
      if (content === undefined || content === null) {
        throw new Error("No response content received from OpenRouter.");
      }

      return content;
    } catch (err) {
      lastError = err;
      attempt++;
      if (attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError || new Error("Failed to complete OpenRouter request.");
}

export function extractJson(text) {
  if (!text) throw new Error("Empty text response received from AI model.");

  let clean = text.trim();

  // Strip markdown code fences if present
  if (clean.startsWith("```json")) {
    clean = clean.substring(7);
  } else if (clean.startsWith("```")) {
    clean = clean.substring(3);
  }

  if (clean.endsWith("```")) {
    clean = clean.substring(0, clean.length - 3);
  }

  clean = clean.trim();

  try {
    return JSON.parse(clean);
  } catch (initialErr) {
    // If there is extra text around JSON, find first { and last }
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = clean.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    }
    throw initialErr;
  }
}
