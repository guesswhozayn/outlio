import { NextResponse } from 'next/server';
import { fetchFreeModels } from '@/lib/openrouter';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const models = await fetchFreeModels();
    return NextResponse.json({ models });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
