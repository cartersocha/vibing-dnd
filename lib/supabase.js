import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!url) {
  throw new Error('SUPABASE_URL environment variable is required.');
}

if (!serviceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be configured.');
}

export function getSupabaseServerClient() {
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false
    }
  });
}
