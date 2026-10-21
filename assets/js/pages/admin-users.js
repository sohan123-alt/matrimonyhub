import { requireAuth } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { listUsers, setUserStatus, setUserRole } from '../services/user.service.js';
import { whoHTML } from '../components/profile-detail.js';
import { confirmModal } from '../components/modal.js';
import { showToast } from '../utils/toast.js';
import { esc, fmtDate } from '../utils/formatters.js';
import { emptyState } from '../components/profile-card.js';

const { user } = await requireAuth(['ADMIN']);
initShell({ variant: 'admin', active: 'users', title: 'Users', user });
const body = document.getElementById('rows');
const q = document.getElementById('q'), roleF = document.getElementById('roleF');
let users = [];

async function load() {
  try { users = await listUsers(); render(); }
  catch (e) { body.innerHTML = `<tr><td colspan="5">${emptyState('fa-triangle-exclamation', 'Could not load users', esc(e.message))}</td></tr>`; }
}
function render() {
  const term = q.value.trim().toLowerCase();
  const rows = users.filter(u => (!roleF.value || u.role === roleF.value) && (!term || (u.email + ' ' + (u.full_name || '')).toLowerCase().includes(term)));
  document.getElementById('count').textContent = rows.length + ' of ' + users.length + ' users';
  if (!rows.length) { body.innerHTML = `<tr><td colspan="5"><div class="empty"><div class="e-ico"><i class="fas fa-user-slash"></i></div><h3>No users found</h3><p>Try a different search or role.</p></div></td></tr>`; return; }
  body.innerHTML = rows.map(u => {
    const me = u.id === user.id, active = u.status === 'ACTIVE';
    return `<tr class="${me ? 'me' : ''}">
      <td>${whoHTML(u.full_name || 'No name', u.email)}</td>
      <td>${me ? '<span class="badge badge-premium">Admin (you)</span>' : `<select class="select sm" data-role="${u.id}">${['USER', 'STAFF', 'ADMIN'].map(r => `<option ${r === u.role ? 'selected' : ''}>${r}</option>`).join('')}</select>`}</td>
      <td><span class="badge ${active ? 'badge-paid' : 'badge-failed'}">${u.status.charAt(0) + u.status.slice(1).toLowerCase()}</span></td>
      <td>${fmtDate(u.created_at)}</td>
      <td>${me ? '' : `<button class="btn btn-sm ${active ? 'btn-outline' : 'btn-primary'}" data-toggle="${u.id}">${active ? '<i class="fas fa-user-slash"></i> Deactivate' : '<i class="fas fa-user-check"></i> Activate'}</button>`}</td></tr>`;
  }).join('');
}

body.addEventListener('click', async e => {
  const btn = e.target.closest('[data-toggle]'); if (!btn) return;
  const u = users.find(x => x.id === btn.dataset.toggle), next = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  if (!await confirmModal({ title: next === 'INACTIVE' ? 'Deactivate account' : 'Activate account', text: `${next === 'INACTIVE' ? 'Deactivate' : 'Activate'} <b>${esc(u.email)}</b>?${next === 'INACTIVE' ? ' They will not be able to log in.' : ''}`, confirmLabel: next === 'INACTIVE' ? 'Deactivate' : 'Activate' })) return;
  try { await setUserStatus(u.id, next); u.status = next; render(); showToast('Account ' + next.toLowerCase(), 'success'); } catch (err) { showToast(err.message, 'error'); }
});
body.addEventListener('change', async e => {
  const sel = e.target.closest('[data-role]'); if (!sel) return;
  const u = users.find(x => x.id === sel.dataset.role);
  if (!await confirmModal({ title: 'Change role', text: `Make <b>${esc(u.email)}</b> a <b>${sel.value}</b>?`, confirmLabel: 'Change role' })) { sel.value = u.role; return; }
  try { await setUserRole(u.id, sel.value); u.role = sel.value; showToast('Role updated', 'success'); } catch (err) { showToast(err.message, 'error'); sel.value = u.role; }
});
q.addEventListener('input', render); roleF.addEventListener('change', render);
load();
