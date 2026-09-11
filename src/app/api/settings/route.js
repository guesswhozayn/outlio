import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const isLocal = !process.env.KV_REST_API_URL;

const getLocalKvPath = () => {
  try {
    fs.accessSync(process.cwd(), fs.constants.W_OK);
    return path.join(process.cwd(), 'local_kv.json');
  } catch {
    return path.join('/tmp', 'local_kv.json');
  }
};

const LOCAL_KV_PATH = getLocalKvPath();

async function getLocalSettings(email) {
  try {
    if (!fs.existsSync(LOCAL_KV_PATH)) {
      return null;
    }
    const data = fs.readFileSync(LOCAL_KV_PATH, 'utf8');
    const parsed = JSON.parse(data);
    return parsed[`settings:${email}`] || null;
  } catch {
    return null;
  }
}

async function setLocalSettings(email, settings) {
  let data = {};
  try {
    if (fs.existsSync(LOCAL_KV_PATH)) {
      const fileData = fs.readFileSync(LOCAL_KV_PATH, 'utf8');
      data = JSON.parse(fileData);
    }
  } catch {
    // Ignore read errors, just overwrite
  }
  
  data[`settings:${email}`] = settings;
  fs.writeFileSync(LOCAL_KV_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    let settings;
    
    if (isLocal) {
      settings = await getLocalSettings(email);
    } else {
      settings = await kv.get(`settings:${email}`);
    }

    return NextResponse.json(settings || {});
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const data = await req.json();

    if (isLocal) {
      await setLocalSettings(email, data);
    } else {
      await kv.set(`settings:${email}`, data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
