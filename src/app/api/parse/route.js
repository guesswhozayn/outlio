import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { chatCompletion, extractJson, DEFAULT_MODEL } from '@/lib/openrouter';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postText, image, mimeType, model, userModel } = await req.json();

    const selectedModel = model || userModel || DEFAULT_MODEL;

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
  "skills": string,
  "comprehensiveSkills": string,
  "keyRequirements": string[]
}

LinkedIn Post / Job Description:
${postText || "(See attached image)"}
`;

    const systemMessage = {
      role: "system",
      content: "You are an expert AI parser that extracts structured information from job posts and LinkedIn listings. You MUST return strictly a raw, valid JSON object matching the requested schema. Do not enclose in markdown ticks if possible, and do not provide any explanation outside the JSON.",
    };

    let userContent;
    if (image) {
      userContent = [
        {
          type: "text",
          text: prompt,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType || 'image/png'};base64,${image}`,
          },
        },
      ];
    } else {
      userContent = prompt;
    }

    const rawResponse = await chatCompletion({
      model: selectedModel,
      messages: [
        systemMessage,
        { role: "user", content: userContent },
      ],
    });

    const parsedData = extractJson(rawResponse);

    const normalized = {
      email: parsedData.email || null,
      company: parsedData.company || null,
      jobTitle: parsedData.jobTitle || null,
      recipientName: parsedData.recipientName || "Hiring Team",
      skills: parsedData.skills || "",
      comprehensiveSkills: parsedData.comprehensiveSkills || "",
      keyRequirements: Array.isArray(parsedData.keyRequirements)
        ? parsedData.keyRequirements
        : (parsedData.keyRequirements ? [String(parsedData.keyRequirements)] : []),
    };

    return NextResponse.json(normalized);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
