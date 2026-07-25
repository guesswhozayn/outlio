import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
  try {
    const { 
      postText, 
      fields, 
      userProfile, 
      isFollowUp, 
      isColdEmail, 
      coldEmailRole, 
      userApiKey, 
      userModel 
    } = await req.json();

    if (!userApiKey) {
      return NextResponse.json({ error: "Gemini API Key is not configured." }, { status: 400 });
    }

    const modelName = userModel || "gemini-3.5-flash";

    const company = fields?.company || "the company";
    const jobTitle = fields?.jobTitle || "the position";
    const recipientName = fields?.recipientName || "Hiring Team";
    const skills = fields?.skills || "";
    const keyRequirements = fields?.keyRequirements || [];
    
    const candidateName = userProfile?.name || "[Your Name]";
    const phone = userProfile?.phone || "";
    const linkedin = userProfile?.linkedin || "";
    const github = userProfile?.github || "";
    const portfolio = userProfile?.portfolio || "";

    const requirementsStr = Array.isArray(keyRequirements) && keyRequirements.length > 0
      ? keyRequirements.join("\n- ")
      : (typeof keyRequirements === 'string' ? keyRequirements : "");

    let contextType = "Standard Job Application";
    if (isFollowUp) contextType = "Follow-Up Email on Previous Application";
    if (isColdEmail) contextType = `Cold Application for ${coldEmailRole || 'General'} Role`;

    const prompt = `
You are an expert career counselor and professional email writer. 
Write a highly persuasive, professional, and tailored application email from a candidate based on the provided Job Description and Candidate Details.

Context: ${contextType}
Target Company: ${company}
Job Title: ${jobTitle}
Recipient Name: ${recipientName}
Key Tech/Skills: ${skills}
Extracted Requirements/Qualifications:
${requirementsStr ? `- ${requirementsStr}` : "(None explicitly listed)"}

Job Description Text:
${postText || "Not provided directly, rely on target company and job title context."}

Candidate Details:
Name: ${candidateName}
Phone: ${phone}
LinkedIn: ${linkedin}
GitHub: ${github}
Portfolio: ${portfolio}

Instructions:
1. Address the email appropriately (e.g. "Dear ${recipientName},").
2. Highlight specific details, key requirements, or core technologies mentioned in the job description to explain explicitly why the candidate is a strong fit.
3. Keep the tone enthusiastic, polished, professional, and concise (3-4 paragraphs max).
4. Do not include placeholder text like [Insert Date] or bracketed comments.
5. Include a clean signature block with the candidate's name, phone, and links (LinkedIn, GitHub, Portfolio if available).

Return the response strictly as a raw JSON object with this structure:
{
  "subject": "Email subject line",
  "body": "Complete email body text"
}
`;

    const genAI = new GoogleGenerativeAI(userApiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
