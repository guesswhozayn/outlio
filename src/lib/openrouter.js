export const DEFAULT_MODEL = "openrouter/free";

export function getOpenRouterApiKey(customKey) {
  return (
    (customKey && typeof customKey === "string" ? customKey.trim() : "") ||
    process.env.OPENROUTER_API_KEY ||
    ""
  );
}

export async function generateOpenRouterContent({
  apiKey: userApiKey,
  prompt,
  systemInstruction,
  image,
  mimeType,
  maxRetries = 2,
}) {
  const apiKey = getOpenRouterApiKey(userApiKey);
  if (!apiKey) {
    throw new Error(
      "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in your environment or Settings."
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

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
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
          model: DEFAULT_MODEL,
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

        const isTransient =
          response.status === 503 ||
          response.status === 429 ||
          message.toLowerCase().includes("busy") ||
          message.toLowerCase().includes("rate limit") ||
          message.toLowerCase().includes("demand");

        if (attempt < maxRetries && isTransient) {
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 1500));
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
      if (err.message?.toLowerCase().includes("invalid api key") || err.message?.toLowerCase().includes("unauthorized")) {
        throw err;
      }
      attempt++;
      if (attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
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
