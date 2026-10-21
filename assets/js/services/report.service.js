import { supabase } from '../config/supabase.js';

export async function getSummary() {
  const { data, error } = await supabase.rpc('report_summary');
  if (error) throw error;
  return data;
}
export async function saveReport(userId, s) {
  const { error } = await supabase.from('report_logs').insert({
    report_type: 'SUMMARY', generated_by: userId, details: s,
    total_count: s.total_profiles, verified_count: s.verified_profiles, pending_count: s.pending_profiles,
    paid_count: s.premium_profiles, unpaid_count: Math.max(0, s.total_profiles - s.premium_profiles)
  });
  if (error) throw error;
}
export async function listReports() {
  const { data, error } = await supabase.from('report_logs').select('*').order('generated_at', { ascending: false }).limit(10);
  if (error) throw error;
  return data || [];
}
