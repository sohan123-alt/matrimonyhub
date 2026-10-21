import { requireAuth } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { myTasks, updateTask } from '../services/task.service.js';
import { getProfileById, getPhone, setVerified } from '../services/profile.service.js';
import { whoHTML, profileDetailHTML } from '../components/profile-detail.js';
import { openModal } from '../components/modal.js';
import { emptyState } from '../components/profile-card.js';
import { showToast } from '../utils/toast.js';
import { esc, pretty, fmtDate, TASK_LABEL } from '../utils/formatters.js';

const { user } = await requireAuth(['STAFF']);
initShell({ variant: 'staff', active: 'tasks', title: 'My tasks', user });
const board = document.getElementById('board');
let tasks = [];

async function load() {
  try { tasks = await myTasks(user.id); render(); }
  catch (e) { board.className = ''; board.innerHTML = emptyState('fa-triangle-exclamation', 'Could not load tasks', esc(e.message)); }
}
function render() {
  board.innerHTML = Object.entries(TASK_LABEL).map(([k, label]) => {
    const col = tasks.filter(t => t.task_status === k);
    return `<section class="col"><h3>${label}<span>${col.length}</span></h3>${col.length ? col.map(t => `
      <button class="tcard" data-id="${t.id}">
        ${whoHTML(t.profiles?.full_name, t.profiles ? t.profiles.age + (t.profiles.city ? ', ' + t.profiles.city : '') : '', t.profiles?.photo_url)}
        <span class="badge badge-muted">${pretty(t.task_type)}</span>
        ${t.description ? `<p>${esc(t.description)}</p>` : ''}
        <div class="meta" style="margin-top:.6rem"><span>${fmtDate(t.created_at)}</span><i class="fas fa-chevron-right"></i></div>
      </button>`).join('') : '<div class="none">Nothing here</div>'}</section>`;
  }).join('');
}

async function openTask(id) {
  const t = tasks.find(x => x.id === id);
  const [p, phone] = await Promise.all([getProfileById(t.profile_id), getPhone(t.profile_id)]);
  if (!p) return showToast('Profile no longer exists.', 'error');
  const actions = () => {
    const s = t.task_status;
    return (!p.is_verified && t.task_type !== 'REVIEW' ? '<button class="btn btn-outline" id="verBtn"><i class="fas fa-circle-check"></i> Mark profile verified</button>' : '')
      + (s === 'PENDING' ? '<button class="btn btn-primary" id="goBtn" data-to="IN_PROGRESS"><i class="fas fa-play"></i> Start task</button>' : '')
      + (s === 'IN_PROGRESS' ? '<button class="btn btn-primary" id="goBtn" data-to="COMPLETED"><i class="fas fa-check"></i> Complete task</button>' : '')
      + (s === 'COMPLETED' ? '<button class="btn btn-outline" id="goBtn" data-to="IN_PROGRESS"><i class="fas fa-rotate-left"></i> Reopen</button>' : '');
  };
  const m = openModal({ title: pretty(t.task_type) + ' task', wide: true,
    body: `${t.description ? `<p style="margin-bottom:1.2rem"><b>Instructions:</b> ${esc(t.description)}</p>` : ''}<div id="pd">${profileDetailHTML(p, phone)}</div>
      <div class="field" style="margin-top:1.3rem"><label for="notes">Your notes</label><textarea class="textarea" id="notes" placeholder="What did you check? Anything the admin should know?">${esc(t.notes || '')}</textarea></div>`,
    footer: '<button class="btn btn-outline" data-close>Close</button><span id="act" style="display:contents"></span>' });
  const bind = () => {
    m.$('#act').innerHTML = actions();
    const v = m.$('#verBtn'), g = m.$('#goBtn');
    if (v) v.onclick = async () => { try { await setVerified(p.id, true); p.is_verified = true; m.$('#pd').innerHTML = profileDetailHTML(p, phone); showToast('Profile verified', 'success'); bind(); } catch (e) { showToast(e.message, 'error'); } };
    if (g) g.onclick = async () => {
      const patch = { task_status: g.dataset.to, notes: m.$('#notes').value.trim() || null };
      try { await updateTask(t.id, patch); Object.assign(t, patch); showToast('Task ' + TASK_LABEL[patch.task_status].toLowerCase(), 'success'); m.close(); render(); } catch (e) { showToast(e.message, 'error'); }
    };
  };
  bind();
}
board.addEventListener('click', e => { const c = e.target.closest('.tcard'); if (c) openTask(Number(c.dataset.id)); });
load();
