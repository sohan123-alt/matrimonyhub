import { requireAuth } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { listPayments, reviewPayment, PLANS, METHODS } from '../services/payment.service.js';
import { listUsers } from '../services/user.service.js';
import { listAllProfiles } from '../services/profile.service.js';
import { whoHTML } from '../components/profile-detail.js';
import { openModal, confirmModal } from '../components/modal.js';
import { showToast } from '../utils/toast.js';
import { taka, fmtDate, esc, PAY_BADGE } from '../utils/formatters.js';
import { emptyState } from '../components/profile-card.js';

const { user } = await requireAuth(['ADMIN']);
initShell({ variant: 'admin', active: 'payments', title: 'Payments', user });
const body = document.getElementById('rows'), tabsEl = document.getElementById('tabs');
let pays = [], users = new Map(), hasProfile = new Set(), tab = 'PENDING';

async function load() {
  try {
    const [p, u, pr] = await Promise.all([listPayments(), listUsers(), listAllProfiles()]);
    pays = p; users = new Map(u.map(x => [x.id, x])); hasProfile = new Set(pr.map(x => x.user_id)); render();
  } catch (e) { body.innerHTML = `<tr><td colspan="7">${emptyState('fa-triangle-exclamation', 'Could not load payments', esc(e.message))}</td></tr>`; }
}
function render() {
  tabsEl.querySelectorAll('button').forEach(b => { b.classList.toggle('on', b.dataset.t === tab); b.querySelector('small').textContent = b.dataset.t === 'ALL' ? pays.length : pays.filter(p => p.payment_status === b.dataset.t).length; });
  const paid = pays.filter(p => p.payment_status === 'PAID');
  document.getElementById('sPending').textContent = pays.filter(p => p.payment_status === 'PENDING').length;
  document.getElementById('sPaid').textContent = paid.length;
  document.getElementById('sRev').textContent = taka(paid.reduce((a, p) => a + Number(p.amount), 0));
  const rows = pays.filter(p => tab === 'ALL' || p.payment_status === tab);
  if (!rows.length) { body.innerHTML = `<tr><td colspan="7"><div class="empty"><div class="e-ico"><i class="fas fa-receipt"></i></div><h3>No payments here</h3><p>New submissions will appear in the review tab.</p></div></td></tr>`; return; }
  body.innerHTML = rows.map(p => {
    const u = users.get(p.user_id), [cls, label] = PAY_BADGE[p.payment_status];
    return `<tr>
      <td>${whoHTML(u?.full_name || 'Unknown', u?.email)}</td>
      <td>${PLANS[p.plan_type]?.label || esc(p.plan_type)}<div class="muted">${METHODS[p.payment_method]?.label || esc(p.payment_method)}</div></td>
      <td class="mono">${esc(p.transaction_id)}</td><td><b>${taka(p.amount)}</b><div class="muted">${fmtDate(p.payment_date)}</div></td>
      <td><span class="badge ${cls}">${label}</span>${p.notes ? `<div class="muted">${esc(p.notes)}</div>` : ''}</td>
      <td>${p.payment_status === 'PENDING' ? `<div class="row-actions"><button class="btn btn-primary btn-sm" data-ok="${p.id}"><i class="fas fa-check"></i> Approve</button><button class="icon-btn bad" data-no="${p.id}" aria-label="Reject" title="Reject"><i class="fas fa-xmark"></i></button></div>` : (p.plan_end_date ? `<span class="muted">Until ${fmtDate(p.plan_end_date)}</span>` : '')}</td></tr>`;
  }).join('');
}

body.addEventListener('click', async e => {
  const ok = e.target.closest('[data-ok]'), no = e.target.closest('[data-no]');
  if (ok) {
    const p = pays.find(x => x.id === Number(ok.dataset.ok)), u = users.get(p.user_id);
    if (!hasProfile.has(p.user_id)) return showToast('This member has no profile yet, so premium cannot be activated.', 'error');
    if (!await confirmModal({ title: 'Approve payment', text: `Confirm that <b>${taka(p.amount)}</b> (transaction <b>${esc(p.transaction_id)}</b>) from <b>${esc(u?.full_name || u?.email)}</b> has arrived? This turns on their ${PLANS[p.plan_type].label.toLowerCase()} premium plan.`, confirmLabel: 'Approve and activate' })) return;
    try { await reviewPayment(p.id, 'PAID'); showToast('Payment approved. Premium is active.', 'success'); load(); } catch (err) { showToast(err.message, 'error'); }
  }
  if (no) {
    const p = pays.find(x => x.id === Number(no.dataset.no));
    const m = openModal({ title: 'Reject payment', body: `<p>Tell the member why. They will see this note in My payments.</p><div class="field" style="margin-top:1rem"><textarea class="textarea" id="why" placeholder="e.g. We could not find this transaction ID"></textarea></div>`,
      footer: '<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="rej">Reject payment</button>' });
    m.$('#rej').onclick = async () => {
      const why = m.$('#why').value.trim(); if (!why) return showToast('Add a short reason.', 'error');
      try { await reviewPayment(p.id, 'FAILED', why); m.close(); showToast('Payment rejected', 'success'); load(); } catch (err) { showToast(err.message, 'error'); }
    };
  }
});
tabsEl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { tab = b.dataset.t; render(); } });
load();
