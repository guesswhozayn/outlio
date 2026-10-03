import { NextResponse } from 'next/server';
import { fetchGeminiModels } from '@/lib/gemini';

export const dynamic = 'force-dynamic';


export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const queryKey = searchParams.get('apiKey');
    const headerKey = req.headers.get('x-api-key');
    const models = await fetchGeminiModels(queryKey || headerKey);
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { apiKey } = await req.json().catch(() => ({}));
    const models = await fetchGeminiModels(apiKey);
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
