import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getServerSession } from "next-auth/next";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";

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

    const hasOAuth = Boolean(token?.accessToken || token?.refreshToken);
    const hasAppPassword = Boolean(gmailUser && gmailAppPassword);

    if (!hasOAuth && !hasAppPassword) {
      return NextResponse.json({ error: "Gmail authorization missing. Sign in with Google or provide an App Password." }, { status: 400 });
    }

    let authConfig;
    if (hasOAuth) {
      authConfig = {
        type: "OAuth2",
        user: session.user.email || gmailUser,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: token?.refreshToken,
        accessToken: token?.accessToken,
      };
    } else {
      authConfig = {
        user: gmailUser,
        pass: gmailAppPassword,
      };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: authConfig,
    });

    const senderEmail = hasOAuth && session.user.email ? session.user.email : gmailUser;
    const mailOptions = {
      from: userName ? `"${userName.replace(/["\r\n]/g, '')}" <${senderEmail}>` : senderEmail,
      to: toEmail,
      subject: subject,
      text: emailBody,
    };

    if (resumeAttachment) {
      mailOptions.attachments = [resumeAttachment];
    }

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, info: info.response });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
