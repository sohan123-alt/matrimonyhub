import { requireAuth } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { getSummary, saveReport, listReports } from '../services/report.service.js';
import { listPayments, PLANS, METHODS } from '../services/payment.service.js';
import { listAllProfiles } from '../services/profile.service.js';
import { showToast } from '../utils/toast.js';
import { setLoading } from '../utils/ui.js';
import { taka, fmtDate, esc, monthKey } from '../utils/formatters.js';
import { emptyState } from '../components/profile-card.js';

const { user } = await requireAuth(['ADMIN']);
initShell({ variant: 'admin', active: 'reports', title: 'Reports', user });
const $ = id => document.getElementById(id);
const C = { rose: '#e91e63', purple: '#673ab7', green: '#2e9e5b', amber: '#f29a1f', blue: '#2196f3', soft: '#d9c7e8' };
let summary, allPays = [];

async function drawHistory() {
  const rows = await listReports();
  $('history').innerHTML = rows.length ? rows.map(r => `<tr><td>${fmtDate(r.generated_at)}</td><td>${r.total_count}</td><td>${r.verified_count}</td><td>${r.pending_count}</td><td>${r.paid_count}</td><td>${r.unpaid_count}</td></tr>`).join('')
    : '<tr><td colspan="6"><span class="muted">No snapshots saved yet.</span></td></tr>';
}

try {
  let profiles, pays;
  [summary, pays, profiles] = await Promise.all([getSummary(), listPayments({ status: 'PAID' }), listAllProfiles()]);
  allPays = pays;
  const s = summary, free = Math.max(0, s.total_profiles - s.premium_profiles);
  const tile = (ico, color, n, label) => `<div class="stat"><span class="ico ${color}"><i class="fas ${ico}"></i></span><div><b>${n}</b><small>${label}</small></div></div>`;
  $('stats').innerHTML = tile('fa-id-card', 'blue', s.total_profiles, 'Total profiles') + tile('fa-circle-check', 'green', s.verified_profiles, 'Verified') +
    tile('fa-hourglass-half', 'amber', s.pending_profiles, 'Pending verification') + tile('fa-crown', 'purple', s.premium_profiles, 'Paid members') +
    tile('fa-user', 'rose', free, 'Unpaid members') + tile('fa-sack-dollar', 'green', taka(s.revenue), 'Revenue');

  // Revenue: last 6 months
  const months = []; const now = new Date();
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: monthKey(d), label: d.toLocaleString('en-GB', { month: 'short' }), sum: 0 }); }
  pays.forEach(p => { const m = months.find(x => x.key === monthKey(p.verified_date || p.payment_date)); if (m) m.sum += Number(p.amount); });

  Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
  Chart.defaults.color = '#6b5a73';
  new Chart($('cRev'), { type: 'bar', data: { labels: months.map(m => m.label), datasets: [{ data: months.map(m => m.sum), backgroundColor: C.purple, borderRadius: 8, maxBarThickness: 44 }] },
    options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => taka(c.parsed.y) } } }, scales: { y: { beginAtZero: true, grid: { color: '#f0e8f6' }, ticks: { callback: v => taka(v) } }, x: { grid: { display: false } } } } });
  const donut = (id, labels, data, colors) => new Chart($(id), { type: 'doughnut', data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] }, options: { maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } } } });
  donut('cVer', ['Verified', 'Pending'], [s.verified_profiles, s.pending_profiles], [C.green, C.amber]);
  donut('cMem', ['Premium', 'Free'], [s.premium_profiles, free], [C.rose, C.soft]);
  const rel = {}; profiles.forEach(p => { const k = p.religion || 'Not set'; rel[k] = (rel[k] || 0) + 1; });
  new Chart($('cRel'), { type: 'bar', data: { labels: Object.keys(rel), datasets: [{ data: Object.values(rel), backgroundColor: C.rose, borderRadius: 8, maxBarThickness: 40 }] },
    options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f0e8f6' } }, y: { grid: { display: false } } } } });
  await drawHistory();
} catch (err) {
  $('stats').innerHTML = emptyState('fa-triangle-exclamation', 'Could not load reports', esc(err.message) + '. Did you run supabase/admin.sql?');
}

$('saveBtn').addEventListener('click', async () => {
  const btn = $('saveBtn'); setLoading(btn, true, 'Saving...');
  try { await saveReport(user.id, summary); showToast('Snapshot saved', 'success'); await drawHistory(); } catch (e) { showToast(e.message, 'error'); }
  setLoading(btn, false);
});
$('printBtn').addEventListener('click', () => window.print());
$('csvBtn').addEventListener('click', () => {
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const lines = [['Date', 'Plan', 'Method', 'Transaction ID', 'Amount'].join(',')].concat(allPays.map(p => [fmtDate(p.payment_date), PLANS[p.plan_type]?.label, METHODS[p.payment_method]?.label, p.transaction_id, p.amount].map(q).join(',')));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }));
  a.download = 'paid-payments.csv'; a.click(); URL.revokeObjectURL(a.href);
});
