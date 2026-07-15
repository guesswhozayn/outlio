import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { userApiKey } = await req.json();

    if (!userApiKey) {
      return NextResponse.json({ error: "Gemini API Key is not configured." }, { status: 400 });
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${userApiKey}`);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const availableModels = data.models
      .filter(m => m.name.includes("gemini") && m.supportedGenerationMethods.includes("generateContent"))
      .map(m => ({
        name: m.name.replace("models/", ""),
        displayName: m.displayName || m.name.replace("models/", ""),
      }));

    return NextResponse.json({ models: availableModels });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
