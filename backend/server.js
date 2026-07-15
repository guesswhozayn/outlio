const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load standard environment variables
dotenv.config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer storage config for resume
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Save as resume.pdf for simplicity, or preserve name
    cb(null, "resume.pdf");
  },
});
const upload = multer({ storage });

const configPath = path.join(__dirname, "config.json");

// Helper to retrieve configurations merged with config.json and .env
function getConfig() {
  let fileConfig = {};
  if (fs.existsSync(configPath)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (e) {
      console.error("Error reading config.json", e);
    }
  }
  return {
    PORT: process.env.PORT || fileConfig.PORT || 5000,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || fileConfig.GEMINI_API_KEY || "",
    GMAIL_USER: process.env.GMAIL_USER || fileConfig.GMAIL_USER || "",
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || fileConfig.GMAIL_APP_PASSWORD || "",
    USER_NAME: process.env.USER_NAME || fileConfig.USER_NAME || "",
    USER_PHONE: process.env.USER_PHONE || fileConfig.USER_PHONE || "",
    USER_LINKEDIN: process.env.USER_LINKEDIN || fileConfig.USER_LINKEDIN || "",
  };
}

// Helper to save configuration runtime
function saveConfig(newConfig) {
  let existing = {};
  if (fs.existsSync(configPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (e) {}
  }
  const merged = { ...existing, ...newConfig };
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), "utf8");
  return merged;
}

// Settings GET Endpoint
app.get("/api/settings", (req, res) => {
  const currentConfig = getConfig();
  // Don't send Gmail app password for security, just send status
  res.json({
    ...currentConfig,
    hasGmailPassword: !!currentConfig.GMAIL_APP_PASSWORD,
    hasGeminiKey: !!currentConfig.GEMINI_API_KEY,
    resumeExists: fs.existsSync(path.join(uploadsDir, "resume.pdf")),
  });
});

// Settings POST Endpoint
app.post("/api/settings", (req, res) => {
  try {
    const updated = saveConfig(req.body);
    res.json({ success: true, message: "Settings saved successfully", config: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resume Upload Endpoint
app.post("/api/resume/upload", upload.single("resume"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ success: true, filename: req.file.filename, message: "Resume uploaded successfully" });
});

// Parse LinkedIn Post Endpoint using Gemini API
app.post("/api/parse", async (req, res) => {
  const { postText, userApiKey } = req.body;
  
  if (!postText || postText.trim() === "") {
    return res.status(400).json({ error: "LinkedIn post text is required." });
  }

  const currentConfig = getConfig();
  const apiKey = userApiKey || currentConfig.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: "Gemini API Key is not configured. Please supply it in settings." });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
Analyze the following LinkedIn post or job description. Extract the following information:
1. HR Email Address (or the email specified to send applications to). If multiple are found, list the primary one. If none are found, return null.
2. Company Name.
3. Job Title (Position).
4. Hiring Manager's Name or Team Name (e.g. "John Doe", "Hiring Team", or "Talent Acquisition Team" - default to "Hiring Team" if not specified).
5. The core technologies, programming languages, or domains mentioned (e.g. "React, Node.js, MERN stack" or "Python, data analysis").
6. The key skills or requirements (short list of main qualifications).

Return the result as a raw JSON object matching this schema:
{
  "email": string or null,
  "company": string or null,
  "jobTitle": string or null,
  "recipientName": string,
  "skills": string, // comma-separated list of 2-4 key tech/domains
  "keyRequirements": string[] // list of key requirements
}

LinkedIn Post / Job Description:
${postText}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    res.json(parsedData);
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Send Application Email Endpoint
app.post("/api/send", async (req, res) => {
  const { toEmail, subject, emailBody } = req.body;
  const currentConfig = getConfig();

  if (!toEmail) {
    return res.status(400).json({ error: "Recipient email is required." });
  }
  if (!currentConfig.GMAIL_USER || !currentConfig.GMAIL_APP_PASSWORD) {
    return res.status(400).json({ error: "Gmail sender configurations are missing." });
  }

  const resumeFilePath = path.join(uploadsDir, "resume.pdf");
  if (!fs.existsSync(resumeFilePath)) {
    return res.status(400).json({ error: "Resume file is missing. Please upload your resume first." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: currentConfig.GMAIL_USER,
        pass: currentConfig.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: currentConfig.GMAIL_USER,
      to: toEmail,
      subject: subject,
      text: emailBody,
      attachments: [
        {
          filename: "Resume.pdf",
          path: resumeFilePath,
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: " + info.response);
    res.json({ success: true, message: "Email sent successfully", info: info.response });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ error: error.message });
  }
});

const config = getConfig();
app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
});
