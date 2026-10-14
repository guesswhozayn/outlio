import { GoogleGenerativeAI } from "@google/generative-ai";

let cachedAvailableModels = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export function parseModelVersion(modelName = "") {
  const cleanName = modelName.toLowerCase().replace(/^models\//, "");
  const match = cleanName.match(/gemini-(\d+(?:\.\d+)?)/);
  if (!match) return -1;
  const majorMinor = parseFloat(match[1]);
  return isNaN(majorMinor) ? 0 : majorMinor;
}

export function getRankedModels(modelsList = []) {
  if (!Array.isArray(modelsList) || modelsList.length === 0) return [];

  const supportedModels = modelsList.filter((m) => {
    const name = (m.name || "").toLowerCase();
    const isLegacy = name.includes("1.5") || name.includes("1.0") || name.includes("embedding") || name.includes("aqa");
    return name.startsWith("gemini-") && !isLegacy;
  });

  supportedModels.sort((a, b) => {
    const nameA = (a.name || "").toLowerCase();
    const nameB = (b.name || "").toLowerCase();

    const verA = parseModelVersion(nameA);
    const verB = parseModelVersion(nameB);
    if (verB !== verA) return verB - verA;

    const getTier = (n) => {
      if (n.includes("flash-lite") || n.includes("lite")) return 1;
      if (n.includes("pro")) return 2;
      if (n.includes("flash")) return 3;
      return 2;
    };
    const tierDiff = getTier(nameB) - getTier(nameA);
    if (tierDiff !== 0) return tierDiff;

    return nameB.localeCompare(nameA);
  });

  return supportedModels;
}

export function pickBestModel(modelsList = []) {
  const ranked = getRankedModels(modelsList);
  return ranked[0] || null;
}

export const getRankedFlashModels = getRankedModels;
export const pickBestFlashModel = pickBestModel;

export function getGeminiApiKey(customKey) {
  return (customKey && typeof customKey === "string" ? customKey.trim() : "") ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    "";
}

export const ALL_SUPPORTED_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.1-pro",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.5-flash-lite",
];

export const DEFAULT_MODEL = "gemini-3.8-flash";
export const FALLBACK_MODELS = ALL_SUPPORTED_MODELS.slice(1);

export async function fetchGeminiModels(customKey) {
  const apiKey = getGeminiApiKey(customKey);
  const now = Date.now();

  if (cachedAvailableModels.length > 0 && now - lastFetchTime < CACHE_TTL_MS && !customKey) {
    return cachedAvailableModels;
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
          const formatted = data.models
            .map((m) => ({
              name: m.name ? m.name.replace(/^models\//, "") : "",
              displayName: m.displayName || m.name,
              description: m.description,
              supportedGenerationMethods: m.supportedGenerationMethods || [],
              isVision: true,
            }))
            .filter((m) => {
              return (
                !m.supportedGenerationMethods.length ||
                m.supportedGenerationMethods.includes("generateContent")
              );
            });

          const ranked = getRankedModels(formatted);
          if (ranked.length > 0) {
            if (!customKey) {
              cachedAvailableModels = ranked;
              lastFetchTime = now;
            }
            return ranked;
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch models from Gemini API:", err.message);
    }
  }

  const fallbackList = ALL_SUPPORTED_MODELS.map((name) => ({
    name,
    displayName: name
      .replace("gemini-", "Gemini ")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    isVision: true,
  }));

  return fallbackList;
}

export async function getLatestBestModel(customKey) {
  const models = await fetchGeminiModels(customKey);
  return models[0] || {
    name: DEFAULT_MODEL,
    displayName: "Gemini 3.8 Flash",
    isVision: true,
  };
}

export const getLatestBestFlashModel = getLatestBestModel;

export async function generateGeminiContent({
  apiKey: userApiKey,
  model,
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

  // Dynamically discover all supported models for this key/account
  const liveModels = await fetchGeminiModels(userApiKey);
  const discoveredNames = liveModels.map((m) => m.name).filter(Boolean);

  // Compile candidate models in prioritized order:
  // 1. Any specifically passed model if provided
  // 2. Discovered live models ranked from best to fallback
  // 3. Complete list of all supported latest models
  const candidateModels = [
    ...(model && model.startsWith("gemini") ? [model] : []),
    ...discoveredNames,
    ...ALL_SUPPORTED_MODELS,
  ].filter((val, idx, arr) => arr.indexOf(val) === idx);

  let lastError = null;

  for (let candidateIdx = 0; candidateIdx < candidateModels.length; candidateIdx++) {
    const currentModelName = candidateModels[candidateIdx];
    let attempt = 0;

    while (attempt <= maxRetries) {
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
        const isQuotaExceeded =
          err.status === 429 ||
          message.includes("429") ||
          message.toLowerCase().includes("quota") ||
          message.toLowerCase().includes("exceeded your current quota");

        if (isQuotaExceeded) {
          console.warn(`Quota limit reached on ${currentModelName}. Trying next best available model...`);
          break; // Break retry loop on this model, switch to next candidate model
        }

        const isTransient =
          err.status === 503 ||
          message.includes("503") ||
          message.toLowerCase().includes("busy") ||
          message.toLowerCase().includes("high demand");

        attempt++;
        if (attempt <= maxRetries && isTransient) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }
        break;
      }
    }
  }

  // If all candidate models exhausted quota, provide clear error message
  const isAllQuota = (lastError?.message || "").includes("429") || (lastError?.message || "").includes("quota");
  if (isAllQuota) {
    throw new Error(
      `Gemini Free Tier daily quota limit reached on your Google AI Studio project across all supported models. You can either link billing at aistudio.google.com for higher limits, or wait for the daily quota reset.`
    );
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
