import { requireAuth } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { listTasks, listStaff, createTask, updateTask } from '../services/task.service.js';
import { listAllProfiles } from '../services/profile.service.js';
import { whoHTML } from '../components/profile-detail.js';
import { openModal } from '../components/modal.js';
import { showToast } from '../utils/toast.js';
import { esc, fmtDate, pretty, TASK_LABEL } from '../utils/formatters.js';
import { emptyState } from '../components/profile-card.js';

const { user } = await requireAuth(['ADMIN']);
initShell({ variant: 'admin', active: 'tasks', title: 'Tasks', user });
const body = document.getElementById('rows'), tabsEl = document.getElementById('tabs');
let tasks = [], staff = [], tab = 'ALL';

async function load() {
  try { [tasks, staff] = await Promise.all([listTasks(), listStaff()]); render(); }
  catch (e) { body.innerHTML = `<tr><td colspan="6">${emptyState('fa-triangle-exclamation', 'Could not load tasks', esc(e.message))}</td></tr>`; }
}
function render() {
  tabsEl.querySelectorAll('button').forEach(b => { b.classList.toggle('on', b.dataset.t === tab); b.querySelector('small').textContent = b.dataset.t === 'ALL' ? tasks.length : tasks.filter(t => t.task_status === b.dataset.t).length; });
  const rows = tasks.filter(t => tab === 'ALL' || t.task_status === tab);
  if (!rows.length) { body.innerHTML = `<tr><td colspan="6"><div class="empty"><div class="e-ico"><i class="fas fa-list-check"></i></div><h3>No tasks here</h3><p>Create a task to ask staff to verify a profile.</p></div></td></tr>`; return; }
  body.innerHTML = rows.map(t => `<tr>
    <td>${whoHTML(t.profiles?.full_name, t.profiles ? t.profiles.age + (t.profiles.city ? ', ' + t.profiles.city : '') : '', t.profiles?.photo_url)}</td>
    <td>${pretty(t.task_type)}<div class="muted">${esc(t.description || '')}</div></td>
    <td><select class="select sm" data-assign="${t.id}"><option value="">Unassigned</option>${staff.map(s => `<option value="${s.id}" ${s.id === t.assigned_to ? 'selected' : ''}>${esc(s.full_name || s.email)}</option>`).join('')}</select></td>
    <td><select class="select sm" data-status="${t.id}">${Object.entries(TASK_LABEL).map(([k, v]) => `<option value="${k}" ${k === t.task_status ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
    <td>${fmtDate(t.created_at)}</td></tr>`).join('');
}

body.addEventListener('change', async e => {
  const a = e.target.closest('[data-assign]'), s = e.target.closest('[data-status]');
  const el = a || s; if (!el) return;
  const t = tasks.find(x => x.id === Number(el.dataset.assign || el.dataset.status));
  const patch = a ? { assigned_to: a.value || null } : { task_status: s.value };
  try { await updateTask(t.id, patch); Object.assign(t, patch); if (s) render(); showToast('Task updated', 'success'); }
  catch (err) { showToast(err.message, 'error'); render(); }
});
tabsEl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { tab = b.dataset.t; render(); } });

document.getElementById('newBtn').addEventListener('click', async () => {
  let profiles = [];
  try { profiles = await listAllProfiles(); } catch (e) { return showToast(e.message, 'error'); }
  if (!profiles.length) return showToast('No profiles to review yet.', 'info');
  const m = openModal({ title: 'New task',
    body: `<div class="field"><label for="nProfile">Profile</label><select class="select" id="nProfile">${profiles.map(p => `<option value="${p.id}">${esc(p.full_name)}, ${p.age}${p.is_verified ? ' (verified)' : ''}</option>`).join('')}</select></div>
      <div class="form-grid"><div class="field"><label for="nType">Type</label><select class="select" id="nType"><option>VERIFICATION</option><option>REVIEW</option><option>APPROVAL</option></select></div>
      <div class="field"><label for="nStaff">Assign to</label><select class="select" id="nStaff"><option value="">Unassigned</option>${staff.map(s => `<option value="${s.id}">${esc(s.full_name || s.email)}</option>`).join('')}</select></div></div>
      <div class="field"><label for="nDesc">Instructions</label><textarea class="textarea" id="nDesc" placeholder="What should the staff member check?"></textarea></div>`,
    footer: '<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="nSave"><i class="fas fa-plus"></i> Create task</button>' });
  m.$('#nSave').onclick = async () => {
    try {
      await createTask({ profile_id: Number(m.$('#nProfile').value), task_type: m.$('#nType').value, assigned_to: m.$('#nStaff').value || null, description: m.$('#nDesc').value.trim() || null });
      m.close(); showToast('Task created', 'success'); load();
    } catch (err) { showToast(err.message, 'error'); }
  };
});
load();
