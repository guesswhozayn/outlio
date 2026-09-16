import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    try {
      return new Redis({ url, token });
    } catch (err) {
      console.warn("Failed to initialize Upstash Redis client:", err);
      return null;
    }
  }
  return null;
}

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
    const redis = getRedisClient();
    let settings = null;
    let storageType = 'local_file';

    if (redis) {
      try {
        settings = await redis.get(`settings:${email}`);
        storageType = 'redis';
      } catch (redisErr) {
        console.error("Redis get failed, falling back to local:", redisErr);
        settings = await getLocalSettings(email);
        storageType = 'local_fallback';
      }
    } else {
      settings = await getLocalSettings(email);
      storageType = LOCAL_KV_PATH.startsWith('/tmp') ? 'ephemeral' : 'local_file';
    }

    const isCloud = storageType === 'redis';
    const cleanSettings = settings && typeof settings === 'object' ? { ...settings } : {};
    delete cleanSettings._sync;

    return NextResponse.json({
      ...cleanSettings,
      _sync: {
        isCloud,
        storageType,
      }
    }, {
      headers: {
        'x-storage-backend': storageType,
      }
    });
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

    const toSave = { ...data };
    delete toSave._sync;

    const redis = getRedisClient();
    let storageType = 'local_file';

    if (redis) {
      try {
        await redis.set(`settings:${email}`, toSave);
        storageType = 'redis';
      } catch (redisErr) {
        console.error("Redis set failed, falling back to local:", redisErr);
        await setLocalSettings(email, toSave);
        storageType = 'local_fallback';
      }
    } else {
      await setLocalSettings(email, toSave);
      storageType = LOCAL_KV_PATH.startsWith('/tmp') ? 'ephemeral' : 'local_file';
    }

    return NextResponse.json({
      success: true,
      isCloud: storageType === 'redis',
      storageType,
    }, {
      headers: {
        'x-storage-backend': storageType,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
