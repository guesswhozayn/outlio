import { NextResponse } from 'next/server';
import { chatCompletion, DEFAULT_MODEL } from '@/lib/openrouter';

export async function POST(req) {
  try {
    const { latexCode, jobDescription, model, userModel } = await req.json();

    if (!latexCode) {
      return NextResponse.json({ error: "No base LaTeX resume provided." }, { status: 400 });
    }

    const selectedModel = model || userModel || DEFAULT_MODEL;

    const systemMessage = {
      role: "system",
      content: "You are an expert career coach and LaTeX developer. You strictly return valid LaTeX code without any markdown code blocks, explanations, or commentary.",
    };

    const prompt = `
You are an expert career coach and LaTeX developer.
I will provide you with a base LaTeX resume and a job description.
Your task is to tailor the LaTeX resume to perfectly match the job description.
You should emphasize skills and experiences that align with the requirements, and perhaps adjust the summary or bullet points slightly to make the candidate look like a perfect fit, without making up fake experiences (just reframe existing ones).
Crucially, if the resume includes a headline, professional title, or role beneath the candidate's name (e.g., "Software Engineer", "Frontend Developer"), update this title to the best matching option based on the job description so it directly mirrors the role they are applying for.

CRITICAL REQUIREMENTS FOR LATEX:
1. DO NOT change ANY LaTeX document structure, preamble, styling, or formatting commands.
2. DO NOT add, remove, or modify the layout, margins, spacing, or structural environment names (e.g., itemize, resumeItem, cvsection).
3. ONLY modify the plain text content within bullet points, summaries, or the professional title.
4. Keep the exact same number of bullet points unless absolutely necessary.
5. Ensure the output is strictly valid LaTeX code that can be compiled with pdflatex.

Return ONLY the raw LaTeX code. Do not include markdown formatting like \`\`\`latex or any conversational text.

Job Description:
${jobDescription || "General Software Engineering Role"}

Base LaTeX Resume:
${latexCode}
`;

    let responseText = await chatCompletion({
      model: selectedModel,
      messages: [
        systemMessage,
        { role: "user", content: prompt },
      ],
    });

    // Strip markdown formatting if the model included it
    responseText = responseText.trim();
    if (responseText.startsWith('```latex')) {
      responseText = responseText.substring(responseText.indexOf('\n') + 1);
    } else if (responseText.startsWith('```')) {
      responseText = responseText.substring(responseText.indexOf('\n') + 1);
    }
    if (responseText.endsWith('```')) {
      responseText = responseText.substring(0, responseText.lastIndexOf('```'));
    }

    return NextResponse.json({ latex: responseText.trim() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
