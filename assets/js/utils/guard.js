import { supabase } from '../config/supabase.js';

const ROOT = '../../';
const HOME = { USER: 'pages/user/dashboard.html', ADMIN: 'pages/admin/dashboard.html', STAFF: 'pages/staff/dashboard.html' };

// Protected page er shurute call koro. Login na thakle ba role mile na hole redirect kore.
// Note: eta shudhu UX. Asol security Supabase RLS e.
export async function requireAuth(roles = ['USER']) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { location.replace(ROOT + 'login.html'); return new Promise(() => {}); }

  const { data } = await supabase.from('app_users').select('role,status').eq('id', session.user.id).maybeSingle();
  const role = data?.role || 'USER';
  if ((data?.status || 'ACTIVE') !== 'ACTIVE') {
    await supabase.auth.signOut(); location.replace(ROOT + 'login.html'); return new Promise(() => {});
  }
  if (!roles.includes(role)) { location.replace(ROOT + HOME[role]); return new Promise(() => {}); }
  return { user: session.user, role };
}

// Premium active kina (profile row theke)
export const isActivePremium = p => !!p && p.is_premium && (!p.premium_until || new Date(p.premium_until) >= new Date(new Date().toDateString()));
