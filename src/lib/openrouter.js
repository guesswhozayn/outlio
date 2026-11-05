export const DEFAULT_MODEL = "openrouter/free";

export const FALLBACK_FREE_MODELS = [
  { name: "openrouter/free", displayName: "Auto (Best Available)", isVision: true },
  { name: "google/gemma-3-27b-it:free", displayName: "Google: Gemma 3 27B", isVision: true },
  { name: "google/gemma-3-12b-it:free", displayName: "Google: Gemma 3 12B", isVision: true },
  { name: "meta-llama/llama-3.3-70b-instruct:free", displayName: "Meta: Llama 3.3 70B", isVision: false },
  { name: "qwen/qwen-2.5-vl-72b-instruct:free", displayName: "Qwen: Qwen2.5 VL 72B", isVision: true },
  { name: "mistralai/mistral-small-3.1-24b-instruct:free", displayName: "Mistral: Mistral Small 3.1 24B", isVision: true },
];

let cachedFreeModels = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export function getOpenRouterApiKey(customKey) {
  return (
    (customKey && typeof customKey === "string" ? customKey.trim() : "") ||
    process.env.OPENROUTER_API_KEY ||
    ""
  );
}

export async function fetchFreeModels(customKey) {
  const apiKey = getOpenRouterApiKey(customKey);
  const now = Date.now();

  if (cachedFreeModels.length > 0 && now - lastFetchTime < CACHE_TTL_MS && !customKey) {
    return cachedFreeModels;
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
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

    freeModels.sort((a, b) => {
      if (a.name === "openrouter/free") return -1;
      if (b.name === "openrouter/free") return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    if (!customKey) {
      cachedFreeModels = freeModels;
      lastFetchTime = now;
    }

    return freeModels;
  } catch {
    return FALLBACK_FREE_MODELS;
  }
}

export async function generateOpenRouterContent({
  apiKey: userApiKey,
  model = DEFAULT_MODEL,
  prompt,
  systemInstruction,
  image,
  mimeType,
  maxRetries = 2,
}) {
  const apiKey = getOpenRouterApiKey(userApiKey);
  if (!apiKey) {
    throw new Error(
      "OpenRouter API key is not configured. Please add your OpenRouter API key in Settings."
    );
  }

  const messages = [];
  if (systemInstruction) {
    messages.push({
      role: "system",
      content: systemInstruction,
    });
  }

  let userContent;
  if (image) {
    userContent = [
      {
        type: "text",
        text: prompt || "Extract the information from this image.",
      },
      {
        type: "image_url",
        image_url: {
          url: `data:${mimeType || "image/png"};base64,${image}`,
        },
      },
    ];
  } else {
    userContent = prompt;
  }

  messages.push({
    role: "user",
    content: userContent,
  });

  const liveModels = await fetchFreeModels(userApiKey);
  const candidateModels = [
    ...(model ? [model] : []),
    DEFAULT_MODEL,
    ...liveModels
      .filter((m) => (!image || m.isVision) && m.name !== DEFAULT_MODEL)
      .map((m) => m.name),
    ...FALLBACK_FREE_MODELS
      .filter((m) => (!image || m.isVision) && m.name !== DEFAULT_MODEL)
      .map((m) => m.name),
  ].filter((val, idx, arr) => Boolean(val) && arr.indexOf(val) === idx);

  let lastError = null;

  for (let i = 0; i < Math.min(candidateModels.length, maxRetries + 2); i++) {
    const currentModel = candidateModels[i];

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
          "X-Title": "Outlio",
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
        const isAuthError = response.status === 401 || response.status === 403;
        if (isAuthError) {
          throw new Error(message);
        }
        lastError = new Error(message);
        continue;
      }

      const content = data.choices?.[0]?.message?.content;
      if (content === undefined || content === null) {
        lastError = new Error("No response content received from OpenRouter.");
        continue;
      }

      return content;
    } catch (err) {
      lastError = err;
      if (err.message?.toLowerCase().includes("invalid api key") || err.message?.toLowerCase().includes("unauthorized")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("Failed to complete OpenRouter request.");
}

export const chatCompletion = generateOpenRouterContent;

export function extractJson(text) {
  if (!text) throw new Error("Empty text response received from AI model.");

  let clean = text.trim();

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
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = clean.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    }
    throw initialErr;
  }
}

