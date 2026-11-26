import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Klient so serverovým (secret / service_role) kľúčom. Len na serveri – nikdy do prehliadača. */
export function adminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Chýba SUPABASE_URL alebo SUPABASE_SECRET_KEY v premenných prostredia');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function hasAdmin(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}
