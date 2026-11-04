import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import path from "path";
import fs from "fs";

const API_ENDPOINT = process.env.OUTLIO_API_URL || "http://localhost:3000/api/whatsapp/process";
const WEBHOOK_SECRET = process.env.WHATSAPP_WEBHOOK_SECRET || "";
const AUTH_DIR = path.resolve(process.cwd(), ".whatsapp_auth");

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

async function startWhatsAppBridge() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\nScan this QR code with WhatsApp to connect your account:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) {
        startWhatsAppBridge();
      }
    } else if (connection === "open") {
      console.log("WhatsApp Bridge connected successfully.");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid || "";
      const isGroup = remoteJid.endsWith("@g.us");

      const messageContent =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        "";

      if (!messageContent || messageContent.trim().length < 20) continue;

      let groupName = "Direct Message";
      if (isGroup) {
        try {
          const groupMeta = await sock.groupMetadata(remoteJid);
          groupName = groupMeta.subject || "Community Group";
        } catch {
          groupName = "Community Group";
        }
      }

      console.log(`[WhatsApp] New message from ${groupName} (${remoteJid})`);

      try {
        const response = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(WEBHOOK_SECRET ? { Authorization: `Bearer ${WEBHOOK_SECRET}` } : {}),
          },
          body: JSON.stringify({
            text: messageContent,
            from: remoteJid,
            groupName,
            sender: msg.key.participant || remoteJid,
          }),
        });

        const result = await response.json();
        if (result?.success) {
          console.log(`[WhatsApp Bridge] Job detected: "${result.job?.jobTitle}" at "${result.job?.company}". Email sent: ${result.emailSent}`);
        }
      } catch (err) {
        console.error("[WhatsApp Bridge] Error sending to processing endpoint:", err.message);
      }
    }
  });
}

startWhatsAppBridge().catch(console.error);

