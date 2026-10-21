import { supabase } from '../config/supabase.js';

export const PAGE_SIZE = 12;
const LIST_COLS = 'id,full_name,age,gender,religion,education,occupation,marital_status,city,state,photo_url,is_verified,is_premium';

export async function getMyProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileById(id) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

// RLS: owner ba premium user na hole null ashbe
export async function getPhone(profileId) {
  const { data } = await supabase.from('profile_contacts').select('phone').eq('profile_id', profileId).maybeSingle();
  return data?.phone ?? null;
}

export async function saveProfile(userId, fields, phone) {
  const { data, error } = await supabase.from('profiles')
    .upsert({ ...fields, user_id: userId }, { onConflict: 'user_id' }).select().single();
  if (error) throw error;
  const { error: e2 } = await supabase.from('profile_contacts')
    .upsert({ profile_id: data.id, phone }, { onConflict: 'profile_id' });
  if (e2) throw e2;
  return data;
}

export async function listProfiles(f = {}, page = 1, excludeUserId = null) {
  let q = supabase.from('profiles').select(LIST_COLS, { count: 'exact' });
  if (excludeUserId) q = q.neq('user_id', excludeUserId);
  if (f.gender) q = q.eq('gender', f.gender);
  if (f.ageMin) q = q.gte('age', f.ageMin);
  if (f.ageMax) q = q.lte('age', f.ageMax);
  if (f.religion) q = q.eq('religion', f.religion);
  if (f.marital) q = q.eq('marital_status', f.marital);
  if (f.city) q = q.ilike('city', '%' + f.city.replace(/[%_,]/g, '') + '%');
  const from = (page - 1) * PAGE_SIZE;
  q = q.order('is_premium', { ascending: false }).order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);
  const { data, error, count } = await q;
  if (error) throw error;
  return { rows: data || [], total: count || 0 };
}

const FIELDS = ['full_name', 'age', 'gender', 'religion', 'education', 'occupation', 'marital_status', 'height', 'weight', 'city', 'about_me', 'preferences', 'family_details', 'photo_url'];
export function completion(p) {
  if (!p) return 0;
  return Math.round(FIELDS.filter(k => p[k] !== null && p[k] !== '' && p[k] !== undefined).length / FIELDS.length * 100);
}

// ---- Admin / Staff ----
export async function listAllProfiles({ verified, limit } = {}) {
  let q = supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (verified !== undefined) q = q.eq('is_verified', verified);
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
export async function setVerified(profileId, value) {
  const { error } = await supabase.from('profiles').update({ is_verified: value }).eq('id', profileId);
  if (error) throw error;
}
