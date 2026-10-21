import { requireAuth } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { getSummary } from '../services/report.service.js';
import { listPayments } from '../services/payment.service.js';
import { listAllProfiles } from '../services/profile.service.js';
import { listUsers } from '../services/user.service.js';
import { whoHTML } from '../components/profile-detail.js';
import { emptyState } from '../components/profile-card.js';
import { taka, esc, fmtDate } from '../utils/formatters.js';
import { PLANS } from '../services/payment.service.js';

const { user } = await requireAuth(['ADMIN']);
initShell({ variant: 'admin', active: 'dashboard', title: 'Admin dashboard', user });
const $ = id => document.getElementById(id);

try {
  const [s, pays, unverified, users] = await Promise.all([
    getSummary(), listPayments({ status: 'PENDING', limit: 5 }), listAllProfiles({ verified: false, limit: 5 }), listUsers()
  ]);
  const byId = new Map(users.map(u => [u.id, u]));
  const tile = (href, ico, color, n, label) => `<a class="stat" href="${href}"><span class="ico ${color}"><i class="fas ${ico}"></i></span><div><b>${n}</b><small>${label}</small></div></a>`;
  $('stats').innerHTML =
    tile('users.html', 'fa-users', 'purple', s.total_users, 'Members') +
    tile('profiles.html', 'fa-id-card', 'blue', s.total_profiles, 'Profiles created') +
    tile('profiles.html', 'fa-shield-heart', 'amber', s.pending_profiles, 'Awaiting verification') +
    tile('payments.html', 'fa-hourglass-half', 'rose', s.pending_payments, 'Payments to review') +
    tile('reports.html', 'fa-crown', 'green', s.premium_profiles, 'Active premium') +
    tile('reports.html', 'fa-sack-dollar', 'green', taka(s.revenue), 'Revenue collected');

  const total = Math.max(1, s.tasks_pending + s.tasks_progress + s.tasks_done);
  const w = n => (n / total * 100).toFixed(1) + '%';
  $('tasks').innerHTML = `
    <div class="seg"><i style="width:${w(s.tasks_pending)};background:var(--warning)"></i><i style="width:${w(s.tasks_progress)};background:var(--info)"></i><i style="width:${w(s.tasks_done)};background:var(--success)"></i></div>
    <div class="legend"><span style="--c:var(--warning)">Pending <b>${s.tasks_pending}</b></span><span style="--c:var(--info)">In progress <b>${s.tasks_progress}</b></span><span style="--c:var(--success)">Completed <b>${s.tasks_done}</b></span></div>`;

  $('payList').innerHTML = pays.length ? pays.map(p => {
    const u = byId.get(p.user_id);
    return `<li>${whoHTML(u?.full_name || u?.email, (PLANS[p.plan_type]?.label || p.plan_type) + ' plan, ' + fmtDate(p.payment_date))}<b>${taka(p.amount)}</b><a class="btn btn-outline btn-sm" href="payments.html">Review</a></li>`;
  }).join('') : '<li><span class="muted">No payments waiting. You are all caught up.</span></li>';

  $('verList').innerHTML = unverified.length ? unverified.map(p =>
    `<li>${whoHTML(p.full_name, p.age + (p.city ? ', ' + p.city : ''), p.photo_url)}<a class="btn btn-outline btn-sm" href="profiles.html?open=${p.id}">Open</a></li>`
  ).join('') : '<li><span class="muted">Every profile is verified.</span></li>';
} catch (err) {
  $('stats').innerHTML = emptyState('fa-triangle-exclamation', 'Could not load the dashboard', esc(err.message) + '. Did you run supabase/admin.sql?');
}
