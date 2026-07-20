import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
  try {
    const { latexCode, jobDescription, userApiKey, userModel } = await req.json();

    if (!userApiKey) {
      return NextResponse.json({ error: "Gemini API Key is not configured." }, { status: 400 });
    }
    if (!latexCode) {
      return NextResponse.json({ error: "No base LaTeX resume provided." }, { status: 400 });
    }

    const modelName = userModel || "gemini-3.5-flash";
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

    let result;
    const maxRetries = 2;
    let attempt = 0;
    const genAI = new GoogleGenerativeAI(userApiKey);

    while (attempt <= maxRetries) {
      try {
        const currentModelName = (attempt === maxRetries && modelName.includes("3.5")) ? "gemini-3.1-flash-lite" : modelName;
        
        const model = genAI.getGenerativeModel({
          model: currentModelName,
        });

        result = await model.generateContent(prompt);
        break; 
      } catch (error) {
        attempt++;
        const isUnavailable = error.message?.includes("503") || error.message?.includes("high demand") || error.status === 503;
        
        if (attempt > maxRetries || !isUnavailable) {
          throw error; 
        }
        await new Promise(res => setTimeout(res, 2000));
      }
    }
    let responseText = result.response.text();
    // Strip markdown formatting if the model still includes it
    if (responseText.startsWith('\`\`\`latex')) {
      responseText = responseText.substring(responseText.indexOf('\n') + 1);
    }
    if (responseText.startsWith('\`\`\`')) {
      responseText = responseText.substring(responseText.indexOf('\n') + 1);
    }
    if (responseText.endsWith('\`\`\`')) {
      responseText = responseText.substring(0, responseText.lastIndexOf('\`\`\`'));
    }

    return NextResponse.json({ latex: responseText.trim() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
