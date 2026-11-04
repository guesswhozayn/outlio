import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateGeminiContent, extractJson, DEFAULT_MODEL } from "@/lib/gemini";
import { textToHtml } from "@/lib/emailFormatter";
import { getSupabaseClient } from "@/lib/supabase";

function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, from, groupName, sender } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return NextResponse.json({ message: "Ignored: Content too short" }, { status: 200 });
    }

    const prompt = `
Analyze the following WhatsApp message from community group "${groupName || "Community"}".
Determine if it is a job opportunity or hiring post.

If it IS a job posting, extract:
1. isJob: true
2. email: HR or recruiter contact email to send resume/application to, or null if not found.
3. company: Company or organization name, or null.
4. jobTitle: Position title or role, or null.
5. recipientName: Hiring manager name or team (default "Hiring Team").
6. keyRequirements: Array of 2-4 key skills or requirements.

If it is NOT a job posting, return:
{
  "isJob": false
}

Return strictly a JSON object:
{
  "isJob": boolean,
  "email": string or null,
  "company": string or null,
  "jobTitle": string or null,
  "recipientName": string,
  "keyRequirements": string[]
}

Message:
"""
${text}
"""
`;

    const rawAnalysis = await generateGeminiContent({
      prompt,
      model: DEFAULT_MODEL,
      responseJson: true,
      systemInstruction: "You are a job parser. Respond strictly with raw JSON matching the schema.",
    });

    const parsed = extractJson(rawAnalysis);
    if (!parsed?.isJob || !parsed?.email) {
      return NextResponse.json({
        message: "Message processed: Not a job or no contact email found",
        parsed,
      });
    }

    let userSettings = {
      USER_NAME: process.env.USER_NAME || "Applicant",
      USER_PHONE: process.env.USER_PHONE || "",
      USER_LINKEDIN: process.env.USER_LINKEDIN || "",
      USER_GITHUB: process.env.USER_GITHUB || "",
      USER_PORTFOLIO: process.env.USER_PORTFOLIO || "",
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.from("user_settings").select("*").limit(1).single();
      if (data) {
        userSettings = { ...userSettings, ...data };
      }
    }

    const pTitle = parsed.jobTitle || "the position";
    const cName = parsed.company || "your team";
    const uName = userSettings.USER_NAME || "Applicant";
    const salutation = parsed.recipientName && parsed.recipientName.toLowerCase() !== "hiring team"
      ? `Hi ${parsed.recipientName},`
      : "Hi Hiring Team,";

    const contacts = [
      userSettings.USER_PHONE,
      userSettings.USER_LINKEDIN,
      userSettings.USER_GITHUB,
      userSettings.USER_PORTFOLIO,
    ].filter(Boolean);

    const contactBlock = contacts.length ? `\n${contacts.join(" | ")}` : "";

    const emailSubject = `Application for ${pTitle} – ${uName}`;
    const emailBody = `${salutation}\n\nI noticed the ${pTitle} role shared in the ${groupName || "community"} group and would love to apply.\n\nMy profile aligns with your requirements${parsed.keyRequirements?.length ? ` in ${parsed.keyRequirements.join(", ")}` : ""}. Please let me know if you would be open to a quick chat.\n\nBest regards,\n\n${uName}${contactBlock}`;
    const emailHtml = textToHtml(emailBody);

    const transporter = getTransporter();
    let sent = false;
    let sendError = null;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"${uName}" <${process.env.SMTP_USER}>`,
          to: parsed.email,
          subject: emailSubject,
          text: emailBody,
          html: emailHtml,
        });
        sent = true;
      } catch (err) {
        sendError = err.message;
      }
    }

    if (supabase) {
      await supabase.from("whatsapp_jobs").insert({
        source_group: groupName || from,
        sender,
        raw_text: text,
        job_title: parsed.jobTitle,
        company: parsed.company,
        recipient_email: parsed.email,
        email_sent: sent,
        error: sendError,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      job: parsed,
      emailSent: sent,
      sendError,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

