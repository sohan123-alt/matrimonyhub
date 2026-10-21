import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// Supabase Dashboard > Project Settings > API theke copy koro.
// anon key frontend e thakle problem nai (RLS on thakle). service_role key KOKHONO na.
const SUPABASE_URL = 'https://odshqmbsueiofylkwetl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uMcwj4CpdS4ASxagWW0muA_XNh0UeVP';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
