import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { latexCode, userName } = await req.json();

    if (!latexCode) {
      return NextResponse.json({ error: "No LaTeX code provided." }, { status: 400 });
    }

    const formData = new FormData();
    formData.append('compiler', 'pdflatex');
    const blob = new Blob([latexCode], { type: 'application/x-tex' });
    formData.append('file', blob, 'resume.tex');

    const res = await fetch('https://latex.ytotech.com/builds/sync', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: `Failed to compile PDF: ${errorText}` }, { status: res.status });
    }

    const arrayBuffer = await res.arrayBuffer();
    
    const formattedName = (userName || "user").trim().toLowerCase().replace(/\s+/g, '_') + "_resume.pdf";
    
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${formattedName}"`,
      },
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
