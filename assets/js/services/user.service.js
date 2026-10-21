import { supabase } from '../config/supabase.js';

export async function listUsers() {
  const { data, error } = await supabase.from('app_users').select('id,email,full_name,role,status,created_at').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function setUserStatus(id, status) {
  const { error } = await supabase.from('app_users').update({ status }).eq('id', id);
  if (error) throw error;
}
export async function setUserRole(id, role) {
  const { error } = await supabase.from('app_users').update({ role }).eq('id', id);
  if (error) throw error;
}
