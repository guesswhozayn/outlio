import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { wrapEmailHtml } from "@/lib/emailFormatter";

export async function POST(req) {
  try {
    let toEmail, subject, emailBody, emailHtml, userName, gmailUser, gmailAppPassword;
    let resumeAttachment = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      toEmail = body.toEmail;
      subject = body.subject;
      emailBody = body.emailBody;
      emailHtml = body.emailHtml;
      userName = body.userName;
      gmailUser = body.gmailUser;
      gmailAppPassword = body.gmailAppPassword;

      if (body.resumeBase64) {
        const buffer = Buffer.from(body.resumeBase64, 'base64');
        const formattedName = (userName || "user").trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_') + "_resume.pdf";
        const cleanName = (body.resumeFileName || body.resumeName || formattedName).replace(/[^a-zA-Z0-9._-]/g, '_');
        resumeAttachment = {
          filename: cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`,
          content: buffer,
          contentType: 'application/pdf',
        };
      }
    } else {
      let formData;
      try {
        formData = await req.formData();
      } catch (err) {
        console.error("Failed to parse form data:", err);
        return NextResponse.json({
          error: "Failed to parse form data. Please ensure payload is valid or send as JSON."
        }, { status: 400 });
      }

      toEmail = formData.get('toEmail');
      subject = formData.get('subject');
      emailBody = formData.get('emailBody');
      emailHtml = formData.get('emailHtml');
      userName = formData.get('userName');
      gmailUser = formData.get('gmailUser');
      gmailAppPassword = formData.get('gmailAppPassword');
      const resumeFile = formData.get('resume');

      if (resumeFile && typeof resumeFile !== 'string' && resumeFile.size > 0) {
        const buffer = Buffer.from(await resumeFile.arrayBuffer());
        const formattedName = (userName || "user").trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_') + "_resume.pdf";
        const cleanName = (resumeFile.name || formattedName).replace(/[^a-zA-Z0-9._-]/g, '_');
        resumeAttachment = {
          filename: cleanName.toLowerCase().endsWith('.pdf') ? cleanName : `${cleanName}.pdf`,
          content: buffer,
          contentType: 'application/pdf',
        };
      }
    }

    const cleanUser = (gmailUser || process.env.SMTP_USER || "").trim();
    const cleanPass = (gmailAppPassword || process.env.SMTP_PASS || "").replace(/\s+/g, '');

    if (!cleanUser || !cleanPass) {
      return NextResponse.json({
        error: "Gmail credentials not configured. Please add your Gmail address and 16-character App Password in Settings."
      }, { status: 400 });
    }

    if (!toEmail || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required email fields." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
    });

    const mailOptions = {
      from: userName ? `"${userName.replace(/["\r\n]/g, '')}" <${cleanUser}>` : cleanUser,
      to: toEmail,
      subject: subject,
      text: emailBody,
    };

    if (emailHtml) {
      mailOptions.html = wrapEmailHtml(emailHtml);
    }

    if (resumeAttachment) {
      mailOptions.attachments = [resumeAttachment];
    }

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Nodemailer send error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
