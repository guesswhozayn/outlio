import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function cleanLatexLog(rawText) {
  try {
    const json = JSON.parse(rawText);
    if (json.log_files && json.log_files['__main_document__.log']) {
      const log = json.log_files['__main_document__.log'];
      const lines = log.split('\n');
      const errorLines = lines.filter(l => l.includes('error') || l.includes('Undefined control sequence') || l.startsWith('!'));
      if (errorLines.length > 0) {
        return errorLines.slice(0, 3).join(' | ');
      }
    }
    if (json.error) return json.error;
  } catch {
  }
  return rawText.slice(0, 300);
}

export async function POST(req) {
  try {
    const { latexCode, userName } = await req.json();

    if (!latexCode || typeof latexCode !== 'string' || !latexCode.trim()) {
      return NextResponse.json({ error: "No LaTeX code provided." }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('compiler', 'pdflatex');
    const blob = new Blob([latexCode], { type: 'application/x-tex' });
    formData.append('file', blob, 'resume.tex');

    let res;
    try {
      res = await fetch('https://latex.ytotech.com/builds/sync', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(30000),
      });
    } catch (networkErr) {
      return NextResponse.json(
        { error: `LaTeX compilation service unreachable: ${networkErr.message}` },
        { status: 502 }
      );
    }

    if (!res.ok) {
      const rawError = await res.text();
      const message = cleanLatexLog(rawError);
      return NextResponse.json(
        { error: `LaTeX compilation failed: ${message}` },
        { status: 422 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const formattedName = (userName || "user").trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_') + "_resume.pdf";
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${formattedName}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to process LaTeX compilation request." }, { status: 500 });
  }
}
