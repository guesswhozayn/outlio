import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSupabaseClient } from '@/lib/supabase';
import { encryptPayload, decryptPayload } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

async function verifyCredentials(user, pass) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
  await transporter.verify();
}

function normalizeAuthError(err) {
  const msg = err?.message || '';
  if (err?.code === 'EAUTH' || msg.includes('Username and Password not accepted') || msg.includes('Invalid login')) {
    return 'Invalid Gmail credentials. Ensure 2-Step Verification is enabled on your Google account and use a 16-character App Password (not your personal password).';
  }
  return msg || 'Gmail authentication failed. Please check your address and App Password.';
}

export async function POST(req) {
  try {
    const body = await req.json();
    const action = body.action || 'save';
    
    const settingsPayload = body.settings || {};
    const gmailUser = (
      body.GMAIL_USER ||
      body.gmailUser ||
      settingsPayload.GMAIL_USER ||
      ''
    ).toLowerCase().trim();

    const gmailAppPassword = (
      body.GMAIL_APP_PASSWORD ||
      body.gmailAppPassword ||
      settingsPayload.GMAIL_APP_PASSWORD ||
      ''
    ).replace(/\s+/g, '');

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json(
        { error: 'Gmail address and 16-character App Password are required.' },
        { status: 401 }
      );
    }

    try {
      await verifyCredentials(gmailUser, gmailAppPassword);
    } catch (authErr) {
      return NextResponse.json(
        { error: normalizeAuthError(authErr) },
        { status: 401 }
      );
    }

    if (action === 'verify') {
      return NextResponse.json({ success: true, verified: true });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable. Supabase configuration missing.' },
        { status: 503 }
      );
    }

    if (action === 'fetch') {
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings, updated_at')
        .eq('email', gmailUser)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data || !data.settings) {
        return NextResponse.json({ found: false, settings: null });
      }

      let userSettings = null;
      const rawSettings = typeof data.settings === 'string' ? JSON.parse(data.settings) : data.settings;

      if (rawSettings?.__encrypted) {
        try {
          userSettings = decryptPayload(rawSettings, gmailAppPassword);
        } catch {
          return NextResponse.json(
            { error: 'Failed to decrypt settings with this App Password. Did you regenerate your App Password?' },
            { status: 400 }
          );
        }
      } else {
        userSettings = rawSettings;
      }

      delete userSettings?.GMAIL_APP_PASSWORD;

      return NextResponse.json({
        found: true,
        settings: userSettings,
        updated_at: data.updated_at
      });
    }

    if (action === 'save') {
      const toSave = { ...(body.settings || body), GMAIL_USER: gmailUser };
      delete toSave.GMAIL_APP_PASSWORD;
      delete toSave.action;
      delete toSave.gmailUser;
      delete toSave.gmailAppPassword;
      delete toSave._sync;

      const encrypted = encryptPayload(toSave, gmailAppPassword);
      const payloadToStore = {
        __encrypted: true,
        ...encrypted,
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          email: gmailUser,
          settings: payloadToStore,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, saved: true });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
