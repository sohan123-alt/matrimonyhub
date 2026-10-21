import { requireAuth } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { listAllProfiles, setVerified, getPhone } from '../services/profile.service.js';
import { listStaff, createTask } from '../services/task.service.js';
import { whoHTML, profileDetailHTML } from '../components/profile-detail.js';
import { openModal } from '../components/modal.js';
import { showToast } from '../utils/toast.js';
import { esc, fmtDate } from '../utils/formatters.js';
import { emptyState } from '../components/profile-card.js';
import { isActivePremium } from '../utils/guard.js';

const { user } = await requireAuth(['ADMIN']);
initShell({ variant: 'admin', active: 'profiles', title: 'Profiles', user });
const body = document.getElementById('rows'), q = document.getElementById('q'), tabsEl = document.getElementById('tabs');
let list = [], tab = 'all';
const params = new URLSearchParams(location.search);

async function load() {
  try { list = await listAllProfiles(); render(); if (params.get('open')) openProfile(Number(params.get('open'))); }
  catch (e) { body.innerHTML = `<tr><td colspan="6">${emptyState('fa-triangle-exclamation', 'Could not load profiles', esc(e.message))}</td></tr>`; }
}
const filters = { all: () => true, unverified: p => !p.is_verified, verified: p => p.is_verified, premium: p => isActivePremium(p) };
function render() {
  tabsEl.querySelectorAll('button').forEach(b => { b.classList.toggle('on', b.dataset.t === tab); b.querySelector('small').textContent = list.filter(filters[b.dataset.t]).length; });
  const term = q.value.trim().toLowerCase();
  const rows = list.filter(filters[tab]).filter(p => !term || (p.full_name + ' ' + (p.city || '')).toLowerCase().includes(term));
  if (!rows.length) { body.innerHTML = `<tr><td colspan="6"><div class="empty"><div class="e-ico"><i class="fas fa-id-card"></i></div><h3>No profiles here</h3><p>Nothing matches this view yet.</p></div></td></tr>`; return; }
  body.innerHTML = rows.map(p => `<tr>
    <td>${whoHTML(p.full_name, p.age + ' yrs, ' + (p.gender === 'MALE' ? 'Male' : 'Female'), p.photo_url)}</td>
    <td>${esc(p.city || '-')}<div class="muted">${esc(p.religion || '')}</div></td>
    <td>${p.is_verified ? '<span class="badge badge-verified"><i class="fas fa-circle-check"></i> Verified</span>' : '<span class="badge badge-pending">Pending</span>'}</td>
    <td>${isActivePremium(p) ? '<span class="badge badge-premium"><i class="fas fa-crown"></i> Premium</span>' : '<span class="badge badge-muted">Free</span>'}</td>
    <td>${fmtDate(p.created_at)}</td>
    <td><div class="row-actions">
      <button class="icon-btn" data-view="${p.id}" title="View details" aria-label="View details"><i class="fas fa-eye"></i></button>
      <button class="icon-btn ${p.is_verified ? 'bad' : 'good'}" data-ver="${p.id}" title="${p.is_verified ? 'Remove verification' : 'Verify'}" aria-label="Toggle verification"><i class="fas ${p.is_verified ? 'fa-ban' : 'fa-circle-check'}"></i></button>
    </div></td></tr>`).join('');
}

async function toggleVerify(p) {
  try { await setVerified(p.id, !p.is_verified); p.is_verified = !p.is_verified; render(); showToast(p.is_verified ? 'Profile verified' : 'Verification removed', 'success'); return true; }
  catch (e) { showToast(e.message, 'error'); return false; }
}

async function openProfile(id) {
  const p = list.find(x => x.id === id); if (!p) return;
  const [phone, staff] = await Promise.all([getPhone(p.id), listStaff().catch(() => [])]);
  const paint = () => `
    ${profileDetailHTML(p, phone)}
    <hr style="border:0;border-top:1px solid var(--line);margin:1.4rem 0">
    <h5 style="margin-bottom:.7rem">Assign a verification task</h5>
    ${staff.length ? `<div class="form-grid"><div class="field"><label>Staff member</label><select class="select" id="tStaff">${staff.map(s => `<option value="${s.id}">${esc(s.full_name || s.email)}</option>`).join('')}</select></div>
      <div class="field"><label>Type</label><select class="select" id="tType"><option>VERIFICATION</option><option>REVIEW</option><option>APPROVAL</option></select></div></div>
      <button class="btn btn-outline btn-sm" id="mkTask"><i class="fas fa-list-check"></i> Create task</button>`
      : '<p class="hint">No staff yet. Set a user\'s role to STAFF on the Users page first.</p>'}`;
  const m = openModal({ title: 'Profile details', wide: true, body: paint(), footer: `<button class="btn btn-outline" data-close>Close</button><button class="btn btn-primary" id="verBtn"></button>` });
  const sync = () => { m.$('#verBtn').innerHTML = p.is_verified ? '<i class="fas fa-ban"></i> Remove verification' : '<i class="fas fa-circle-check"></i> Verify profile'; m.$('.modal-body').innerHTML = paint(); bindTask(); };
  const bindTask = () => { const b = m.$('#mkTask'); if (b) b.onclick = async () => {
    try { await createTask({ profile_id: p.id, assigned_to: m.$('#tStaff').value, task_type: m.$('#tType').value, description: 'Check details of ' + p.full_name }); showToast('Task created', 'success'); }
    catch (e) { showToast(e.message, 'error'); } }; };
  m.$('#verBtn').onclick = async () => { if (await toggleVerify(p)) sync(); };
  sync();
}

body.addEventListener('click', e => {
  const v = e.target.closest('[data-view]'), t = e.target.closest('[data-ver]');
  if (v) openProfile(Number(v.dataset.view));
  if (t) toggleVerify(list.find(x => x.id === Number(t.dataset.ver)));
});
tabsEl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { tab = b.dataset.t; render(); } });
q.addEventListener('input', render);
load();
