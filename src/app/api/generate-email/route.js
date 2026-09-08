import { NextResponse } from 'next/server';
import { chatCompletion, extractJson, DEFAULT_MODEL } from '@/lib/openrouter';

export async function POST(req) {
  try {
    const { 
      postText, 
      fields, 
      userProfile, 
      isFollowUp, 
      isColdEmail, 
      coldEmailRole, 
      model, 
      userModel 
    } = await req.json();

    const selectedModel = model || userModel || DEFAULT_MODEL;

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

    const systemMessage = {
      role: "system",
      content: "You are an expert career counselor and professional email writer. You always respond strictly with a raw JSON object containing 'subject' and 'body' keys without markdown or surrounding comments.",
    };

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

    const rawResponse = await chatCompletion({
      model: selectedModel,
      messages: [
        systemMessage,
        { role: "user", content: prompt },
      ],
    });

    const parsedData = extractJson(rawResponse);

    return NextResponse.json({
      subject: parsedData.subject || `Application for ${jobTitle} - ${candidateName}`,
      body: parsedData.body || "",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
