import { GoogleGenerativeAI } from "@google/generative-ai";

export const DEFAULT_MODEL = "gemini-3.8-flash";

export const BEST_MODELS = [
  { name: "gemini-3.8-flash", displayName: "Gemini 3.8 Flash", isVision: true },
  { name: "gemini-3.5-flash", displayName: "Gemini 3.5 Flash", isVision: true },
  { name: "gemini-3.1-pro", displayName: "Gemini 3.1 Pro", isVision: true },
  { name: "gemini-3.1-flash-lite", displayName: "Gemini 3.1 Flash Lite", isVision: true },
  { name: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro", isVision: true },
  { name: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash", isVision: true },
];

export const FALLBACK_MODELS = BEST_MODELS;

export function getGeminiApiKey(customKey) {
  return (customKey && typeof customKey === "string" ? customKey.trim() : "") ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";
}

export async function fetchGeminiModels(customKey) {
  const apiKey = getGeminiApiKey(customKey);
  if (!apiKey) {
    return BEST_MODELS;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      return BEST_MODELS;
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.models)) {
      return BEST_MODELS;
    }

    const availableIds = new Set(
      data.models.map((m) => (m.name ? m.name.replace(/^models\//, "") : ""))
    );

    const matchedModels = BEST_MODELS.filter((bm) => availableIds.has(bm.name));

    return matchedModels.length > 0 ? matchedModels : BEST_MODELS;
  } catch (error) {
    console.error("Failed to fetch Gemini models:", error); 
    return BEST_MODELS;
  }
}

export async function generateGeminiContent({
  apiKey: userApiKey,
  model = DEFAULT_MODEL,
  prompt,
  systemInstruction,
  image, 
  mimeType,
  responseJson = false,
  maxRetries = 2,
}) {
  const apiKey = getGeminiApiKey(userApiKey);
  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured. Please add your Gemini API Key in Configuration Settings."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  let selectedModel = model;
  if (!selectedModel || !selectedModel.startsWith("gemini") || selectedModel === "custom") {
    selectedModel = DEFAULT_MODEL;
  }

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    const currentModelName = 
      attempt === maxRetries && selectedModel.includes("3.") && selectedModel !== "gemini-3.1-flash-lite"
        ? "gemini-3.1-flash-lite"
        : selectedModel;
    

    try {
      const generativeModel = genAI.getGenerativeModel({
        model: currentModelName,
        ...(systemInstruction ? { systemInstruction } : {}),
        generationConfig: {
          ...(responseJson ? { responseMimeType: "application/json" } : {}),
        },
      });

      const parts = [];
      if (prompt) {
        parts.push(prompt);
      }

      if (image) {
        parts.push({
          inlineData: {
            data: image,
            mimeType: mimeType || "image/png",
          },
        });
      }

      const result = await generativeModel.generateContent(parts);
      const response = await result.response; 
      const text = response.text();

      if (text === undefined || text === null) {
        throw new Error("No response content received from Gemini.");
      }

      return text;
    } catch (err) {
      lastError = err;
      const message = err.message || "";
      const isTransient =
        err.status === 503 ||
        err.status === 429 ||
        message.includes("503") ||
        message.includes("429") ||
        message.toLowerCase().includes("busy") ||
        message.toLowerCase().includes("rate limit") ||
        message.toLowerCase().includes("high demand") ||
        message.toLowerCase().includes("quota");

      attempt++;
      if (attempt <= maxRetries && isTransient) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      break;
    }
  }

  throw lastError || new Error("Failed to complete Gemini request.");
}

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
