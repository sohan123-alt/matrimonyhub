import { supabase } from '../config/supabase.js';

const SEL = '*, profiles(id,full_name,age,gender,photo_url,city,is_verified)';

export async function listTasks() {
  const { data, error } = await supabase.from('tasks').select(SEL).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function myTasks(userId) {
  const { data, error } = await supabase.from('tasks').select(SEL).eq('assigned_to', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function listStaff() {
  const { data, error } = await supabase.from('app_users').select('id,email,full_name').eq('role', 'STAFF').eq('status', 'ACTIVE');
  if (error) throw error;
  return data || [];
}
export async function createTask(t) {
  const { error } = await supabase.from('tasks').insert(t);
  if (error) throw error;
}
export async function updateTask(id, patch) {
  const { error } = await supabase.from('tasks').update(patch).eq('id', id);
  if (error) throw error;
}
