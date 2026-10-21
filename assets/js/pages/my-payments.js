import { requireAuth, isActivePremium } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { getMyProfile } from '../services/profile.service.js';
import { myPayments, PLANS, METHODS } from '../services/payment.service.js';
import { emptyState } from '../components/profile-card.js';
import { taka, fmtDate, esc } from '../utils/formatters.js';

const { user } = await requireAuth(['USER']);
initShell({ active: 'payments', title: 'My payments', user });
const root = document.getElementById('list');

try {
  const [profile, rows] = await Promise.all([getMyProfile(user.id), myPayments(user.id)]);
  document.getElementById('plan').innerHTML = isActivePremium(profile)
    ? '<span class="badge badge-premium"><i class="fas fa-crown"></i> Premium</span> until ' + fmtDate(profile.premium_until)
    : '<span class="badge badge-muted">Free plan</span>';

  const cls = { PAID: 'badge-paid', PENDING: 'badge-pending', FAILED: 'badge-failed' };
  const label = { PAID: 'Paid', PENDING: 'In review', FAILED: 'Failed' };
  root.innerHTML = rows.length ? `<div class="panel table-wrap"><table class="tbl">
    <thead><tr><th>Date</th><th>Plan</th><th>Method</th><th>Transaction ID</th><th>Amount</th><th>Status</th></tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td>${fmtDate(r.payment_date)}</td><td>${PLANS[r.plan_type]?.label || esc(r.plan_type)}</td>
      <td>${METHODS[r.payment_method]?.label || esc(r.payment_method)}</td><td class="mono">${esc(r.transaction_id)}</td>
      <td><b>${taka(r.amount)}</b></td><td><span class="badge ${cls[r.payment_status]}">${label[r.payment_status]}</span></td></tr>`).join('')}
    </tbody></table></div>`
    : emptyState('fa-receipt', 'No payments yet', 'When you upgrade to premium, your payments will show up here.', '<a class="btn btn-primary" href="premium.html"><i class="fas fa-crown"></i> See plans</a>');
} catch (err) {
  root.innerHTML = emptyState('fa-triangle-exclamation', 'Could not load payments', esc(err.message));
}
