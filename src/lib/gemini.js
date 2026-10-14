import { GoogleGenerativeAI } from "@google/generative-ai";

let cachedBestFlashModel = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

export function parseModelVersion(modelName = "") {
  const cleanName = modelName.toLowerCase().replace(/^models\//, "");
  const match = cleanName.match(/gemini-(\d+(?:\.\d+)?)-flash(?:-(preview|lite|latest|\d{4,8}))?/);
  if (!match) return -1;
  const majorMinor = parseFloat(match[1]);
  return isNaN(majorMinor) ? 0 : majorMinor;
}

export function pickBestFlashModel(modelsList = []) {
  if (!Array.isArray(modelsList) || modelsList.length === 0) return null;

  const flashModels = modelsList.filter((m) => {
    const name = (m.name || "").toLowerCase();
    const displayName = (m.displayName || "").toLowerCase();
    const isFlash = name.includes("flash") || displayName.includes("flash");
    const isLite = name.includes("lite") || displayName.includes("lite");
    const is8b = name.includes("-8b") || name.includes("8b");
    const isDeprecated = name.includes("1.5") || name.includes("2.0-flash-001");
    return isFlash && !isLite && !is8b && !isDeprecated;
  });

  if (flashModels.length === 0) {
    const anyFlash = modelsList.filter((m) => {
      const name = (m.name || "").toLowerCase();
      return name.includes("flash");
    });
    if (anyFlash.length > 0) return anyFlash[0];
    return modelsList[0] || null;
  }

  flashModels.sort((a, b) => {
    const verA = parseModelVersion(a.name || "");
    const verB = parseModelVersion(b.name || "");
    if (verB !== verA) return verB - verA;
    return (b.name || "").localeCompare(a.name || "");
  });

  return flashModels[0];
}

export function getGeminiApiKey(customKey) {
  return (customKey && typeof customKey === "string" ? customKey.trim() : "") ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";
}

export async function getLatestBestFlashModel(customKey) {
  const apiKey = getGeminiApiKey(customKey);
  const now = Date.now();

  if (cachedBestFlashModel && now - lastFetchTime < CACHE_TTL_MS && !customKey) {
    return cachedBestFlashModel;
  }

  if (apiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { next: { revalidate: 3600 } }
      );

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.models)) {
          const formatted = data.models.map((m) => ({
            name: m.name ? m.name.replace(/^models\//, "") : "",
            displayName: m.displayName || m.name,
            description: m.description,
            supportedGenerationMethods: m.supportedGenerationMethods || [],
          })).filter((m) => {
            return !m.supportedGenerationMethods.length ||
              m.supportedGenerationMethods.includes("generateContent");
          });

          const best = pickBestFlashModel(formatted);
          if (best && best.name) {
            const result = {
              name: best.name,
              displayName: best.displayName || best.name,
              isVision: true,
            };
            if (!customKey) {
              cachedBestFlashModel = result;
              lastFetchTime = now;
            }
            return result;
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch latest Flash model from Gemini API:", err.message);
    }
  }

  return cachedBestFlashModel || {
    name: "gemini-3.8-flash",
    displayName: "Gemini 3.8 Flash (Latest Best Flash)",
    isVision: true,
  };
}

export async function fetchGeminiModels(customKey) {
  const bestModel = await getLatestBestFlashModel(customKey);
  return [bestModel];
}

export const DEFAULT_MODEL = "gemini-3.8-flash";
export const FALLBACK_MODELS = [];

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
    const resolvedBest = await getLatestBestFlashModel(userApiKey);
    selectedModel = resolvedBest?.name || DEFAULT_MODEL;
  }

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    const currentModelName = selectedModel;
    

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
