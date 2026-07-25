import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
  try {
    const { postText, image, mimeType, userApiKey, userModel } = await req.json();

    if (!userApiKey) {
      return NextResponse.json({ error: "Gemini API Key is not configured." }, { status: 400 });
    }

    const prompt = `
Analyze the following LinkedIn post or job description. Extract the following information:
1. HR Email Address (or the email specified to send applications to). If multiple are found, list the primary one. If none are found, return null.
2. Company Name.
3. Job Title (Position).
4. Hiring Manager's Name or Team Name (e.g. "John Doe", "Hiring Team", or "Talent Acquisition Team" - default to "Hiring Team" if not specified).
5. The core technologies, programming languages, or domains mentioned (e.g. "React, Node.js, MERN stack" or "Python, data analysis").
6. The key skills or requirements (short list of main qualifications).
7. A comprehensive list of skills and technologies. This should include ALL extracted skills, plus other highly relevant skills and technologies that are typically associated with this role or the extracted skills. This provides broader context for resume tailoring.
8. Key Requirements & Responsibilities: Extract 2-4 key qualifications, requirements, or responsibilities mentioned in the job post (e.g. "Building RESTful APIs with Node.js", "Designing responsive UI components with React").

Return the result as a raw JSON object matching this schema:
{
  "email": string or null,
  "company": string or null,
  "jobTitle": string or null,
  "recipientName": string,
  "skills": string, // comma-separated list of 2-4 key tech/domains
  "comprehensiveSkills": string, // comprehensive comma-separated list of extracted and inferred relevant skills
  "keyRequirements": string[] // list of 2-4 key requirements/responsibilities extracted directly from the job description
}

LinkedIn Post / Job Description:
${postText || "(See attached image)"}
`;    const requestContent = image ? [
      prompt,
      {
        inlineData: {
          data: image,
          mimeType: mimeType || 'image/png'
        }
      }
    ] : prompt;

    let result;
    const maxRetries = 2;
    let attempt = 0;
    const genAI = new GoogleGenerativeAI(userApiKey);
    const modelName = userModel || "gemini-3.5-flash";

    while (attempt <= maxRetries) {
      try {
        const currentModelName = (attempt === maxRetries && modelName.includes("3.5")) ? "gemini-3.1-flash-lite" : modelName;
        
        const model = genAI.getGenerativeModel({
          model: currentModelName,
          generationConfig: { responseMimeType: "application/json" },
        });

        result = await model.generateContent(requestContent);
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
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
