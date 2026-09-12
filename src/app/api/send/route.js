import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getServerSession } from "next-auth/next";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";

// Helper: build RFC 2822 MIME message using Nodemailer stream transport
async function buildRawMessage(mailOptions) {
  const mail = nodemailer.createTransport({ streamTransport: true, newline: 'unix' });
  const rawBuffer = await new Promise((resolve, reject) => {
    mail.sendMail(mailOptions, (err, info) => {
      if (err) return reject(err);
      const chunks = [];
      info.message.on('data', (chunk) => chunks.push(chunk));
      info.message.on('end', () => resolve(Buffer.concat(chunks)));
      info.message.on('error', reject);
    });
  });

  return rawBuffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    let toEmail, subject, emailBody, gmailUser, gmailAppPassword, userName;
    let resumeAttachment = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      toEmail = body.toEmail;
      subject = body.subject;
      emailBody = body.emailBody;
      gmailUser = body.gmailUser || session.user.email;
      gmailAppPassword = body.gmailAppPassword;
      userName = body.userName;

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
      gmailUser = formData.get('gmailUser') || session.user.email;
      gmailAppPassword = formData.get('gmailAppPassword');
      userName = formData.get('userName');
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

    if (!toEmail || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required email fields." }, { status: 400 });
    }

    const hasOAuth = Boolean(token?.accessToken);
    const hasAppPassword = Boolean(gmailUser && gmailAppPassword);

    if (!hasOAuth && !hasAppPassword) {
      return NextResponse.json({ error: "Gmail authorization missing. Sign in with Google or provide an App Password." }, { status: 400 });
    }

    const senderEmail = session.user.email || gmailUser;
    const mailOptions = {
      from: userName ? `"${userName.replace(/["\r\n]/g, '')}" <${senderEmail}>` : senderEmail,
      to: toEmail,
      subject: subject,
      text: emailBody,
    };

    if (resumeAttachment) {
      mailOptions.attachments = [resumeAttachment];
    }

    // 1. Direct Gmail REST API sending for Google Logged-in users
    if (hasOAuth) {
      const rawMessage = await buildRawMessage(mailOptions);
      const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawMessage }),
      });

      if (!gmailRes.ok) {
        const errData = await gmailRes.json().catch(() => ({}));
        const errMsg = errData.error?.message || "Failed to send email via Gmail API";
        throw new Error(errMsg);
      }

      const result = await gmailRes.json();
      return NextResponse.json({ success: true, messageId: result.id });
    }

    // 2. SMTP fallback for Gmail App Password users
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, info: info.response });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
