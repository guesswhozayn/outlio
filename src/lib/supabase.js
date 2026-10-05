import { createClient } from '@supabase/supabase-js';

export function getSupabaseClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                 process.env.SUPABASE_ANON_KEY;

  const url = rawUrl ? rawUrl.trim().replace(/^["']|["']$/g, '') : null;
  const key = rawKey ? rawKey.trim().replace(/^["']|["']$/g, '') : null;

  if (url && key) {
    try {
      return createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      });
    } catch (err) {
      console.warn("Failed to initialize Supabase client:", err);
      return null;
    }
  }
  return null;
}
