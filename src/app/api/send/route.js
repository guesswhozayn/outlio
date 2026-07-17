import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const toEmail = formData.get('toEmail');
    const subject = formData.get('subject');
    const emailBody = formData.get('emailBody');
    const gmailUser = formData.get('gmailUser');
    const gmailAppPassword = formData.get('gmailAppPassword');
    const resumeFile = formData.get('resume');
    const userName = formData.get('userName');

    if (!toEmail || !subject || !emailBody) {
      return NextResponse.json({ error: "Missing required email fields." }, { status: 400 });
    }

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json({ error: "Gmail configuration missing." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const mailOptions = {
      from: gmailUser,
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
