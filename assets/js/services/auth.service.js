import { supabase } from '../config/supabase.js';

export const HOME_BY_ROLE = {
  USER: 'pages/user/dashboard.html',
  ADMIN: 'pages/admin/dashboard.html',
  STAFF: 'pages/staff/dashboard.html'
};

export async function signUp({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/login.html';
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getAppUser(userId) {
  const { data } = await supabase.from('app_users').select('role,status').eq('id', userId).maybeSingle();
  return data || { role: 'USER', status: 'ACTIVE' };
}

// Role dekhe correct dashboard e pathay. Inactive hole logout kore error dey.
export async function redirectByRole(userId) {
  const { role, status } = await getAppUser(userId);
  if (status !== 'ACTIVE') {
    await supabase.auth.signOut();
    throw new Error('Your account is ' + status.toLowerCase() + '. Please contact support.');
  }
  window.location.href = HOME_BY_ROLE[role] || HOME_BY_ROLE.USER;
}

// ---- Password reset ----
// Supabase > Authentication > URL Configuration > Redirect URLs e <tomar-site>/reset-password.html add korte hobe
export async function sendResetEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: location.origin + '/reset-password.html'
  });
  if (error) throw error;
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
