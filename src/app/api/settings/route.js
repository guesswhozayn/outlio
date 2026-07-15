import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const getLocalDataPath = () => {
  let dataPath = path.join(process.cwd(), 'local_kv.json');
  try {
    fs.accessSync(process.cwd(), fs.constants.W_OK);
  } catch (e) {
    dataPath = path.join('/tmp', 'local_kv.json');
  }
  return dataPath;
};

const getLocalData = () => {
  try {
    const dataPath = getLocalDataPath();
    if (fs.existsSync(dataPath)) {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }
  } catch(e) {}
  return {};
};

const setLocalData = (key, value) => {
  const dataPath = getLocalDataPath();
  const data = getLocalData();
  data[key] = value;
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    let settings;
    
    if (process.env.KV_REST_API_URL) {
      settings = await kv.get(`settings:${email}`);
    } else {
      settings = getLocalData()[`settings:${email}`];
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

    if (process.env.KV_REST_API_URL) {
      await kv.set(`settings:${email}`, data);
    } else {
      setLocalData(`settings:${email}`, data);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
