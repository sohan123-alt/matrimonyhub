import { supabase } from '../config/supabase.js';

export const PLANS = {
  MONTHLY:   { label: 'Monthly',   price: 999,  months: 1,  save: '' },
  QUARTERLY: { label: 'Quarterly', price: 2499, months: 3,  save: 'Save \u09F3498' },
  YEARLY:    { label: 'Yearly',    price: 7999, months: 12, save: 'Save \u09F33,989' }
};

// TODO: nijer asol number/account boshao
export const METHODS = {
  BKASH:         { label: 'bKash',         icon: 'fa-mobile-screen-button', to: '01XXXXXXXXX', how: 'Open bKash, choose Send Money' },
  NAGAD:         { label: 'Nagad',         icon: 'fa-mobile-screen-button', to: '01XXXXXXXXX', how: 'Open Nagad, choose Send Money' },
  ROCKET:        { label: 'Rocket',        icon: 'fa-mobile-screen-button', to: '01XXXXXXXXX-X', how: 'Dial *322# or open the Rocket app' },
  BANK_TRANSFER: { label: 'Bank transfer', icon: 'fa-building-columns',     to: 'A/C 000000000 (Your Bank, Branch)', how: 'Transfer from your bank app or branch' }
};

export async function createPayment({ userId, plan, method, transactionId }) {
  const { error } = await supabase.from('payments').insert({
    user_id: userId, amount: PLANS[plan].price, plan_type: plan,
    payment_method: method, transaction_id: transactionId, payment_status: 'PENDING'
  });
  if (error) throw error;
}

export async function myPayments(userId) {
  const { data, error } = await supabase.from('payments').select('*').eq('user_id', userId).order('payment_date', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ---- Admin ----
export async function listPayments({ status, limit } = {}) {
  let q = supabase.from('payments').select('*').order('payment_date', { ascending: false });
  if (status) q = q.eq('payment_status', status);
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
// PAID kora hole DB trigger premium activate kore
export async function reviewPayment(id, status, notes = null) {
  const { error } = await supabase.from('payments').update({ payment_status: status, notes }).eq('id', id);
  if (error) throw error;
}
