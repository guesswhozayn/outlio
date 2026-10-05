import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getSupabaseClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

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
    const supabase = getSupabaseClient();
    let settings = null;
    let storageType = 'local_file';

    if (supabase) {
      try {
        const { data: record, error: sbError } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('email', email)
          .maybeSingle();

        if (!sbError) {
          if (record && record.settings) {
            settings = record.settings;
          }
          storageType = 'supabase';
        } else {
          console.error("Supabase get failed, falling back to local:", sbError);
          settings = await getLocalSettings(email);
          storageType = 'local_fallback';
        }
      } catch (err) {
        console.error("Supabase query exception, falling back to local:", err);
        settings = await getLocalSettings(email);
        storageType = 'local_fallback';
      }
    } else {
      settings = await getLocalSettings(email);
      storageType = LOCAL_KV_PATH.startsWith('/tmp') ? 'ephemeral' : 'local_file';
    }

    let cleanSettings = {};
    if (settings) {
      if (typeof settings === 'string') {
        try {
          cleanSettings = JSON.parse(settings);
        } catch {
          cleanSettings = {};
        }
      } else if (typeof settings === 'object') {
        cleanSettings = { ...settings };
      }
    }
    delete cleanSettings._sync;

    const isCloud = storageType === 'supabase';

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

    const supabase = getSupabaseClient();
    let storageType = 'local_file';

    if (supabase) {
      try {
        const { error: sbError } = await supabase
          .from('user_settings')
          .upsert({
            email,
            settings: toSave,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });

        if (!sbError) {
          storageType = 'supabase';
        } else {
          console.error("Supabase upsert failed, falling back to local:", sbError);
          await setLocalSettings(email, toSave);
          storageType = 'local_fallback';
        }
      } catch (err) {
        console.error("Supabase upsert exception, falling back to local:", err);
        await setLocalSettings(email, toSave);
        storageType = 'local_fallback';
      }
    } else {
      await setLocalSettings(email, toSave);
      storageType = LOCAL_KV_PATH.startsWith('/tmp') ? 'ephemeral' : 'local_file';
    }

    const isCloud = storageType === 'supabase';

    return NextResponse.json({
      success: true,
      isCloud,
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
