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

    const formData = await req.formData();
    const toEmail = formData.get('toEmail');
    const subject = formData.get('subject');
    const emailBody = formData.get('emailBody');
    const gmailUser = formData.get('gmailUser') || session.user.email;
    const gmailAppPassword = formData.get('gmailAppPassword');
    const resumeFile = formData.get('resume');
    const userName = formData.get('userName');

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

    const mailOptions = {
      from: hasOAuth && session.user.email ? session.user.email : gmailUser,
      to: toEmail,
      subject: subject,
      text: emailBody,
    };

    if (resumeFile && resumeFile.size > 0) {
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      const formattedName = (userName || "user").trim().toLowerCase().replace(/\s+/g, '_') + "_resume.pdf";
      mailOptions.attachments = [
        {
          filename: resumeFile.name || formattedName,
          content: buffer,
        },
      ];
    }

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, info: info.response });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
