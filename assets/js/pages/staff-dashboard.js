import { requireAuth } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { myTasks } from '../services/task.service.js';
import { whoHTML } from '../components/profile-detail.js';
import { emptyState } from '../components/profile-card.js';
import { esc, pretty, fmtDate, TASK_LABEL, TASK_BADGE } from '../utils/formatters.js';

const { user } = await requireAuth(['STAFF']);
initShell({ variant: 'staff', active: 'dashboard', title: 'Staff dashboard', user });
const $ = id => document.getElementById(id);

try {
  const tasks = await myTasks(user.id);
  const n = s => tasks.filter(t => t.task_status === s).length;
  const first = (user.user_metadata?.full_name || 'there').split(' ')[0];
  const open = n('PENDING') + n('IN_PROGRESS');
  $('hello').textContent = 'Hello, ' + first;
  $('helloText').textContent = open ? 'You have ' + open + ' open ' + (open === 1 ? 'task' : 'tasks') + ' waiting for you.' : 'No open tasks right now. Nice work.';
  const tile = (ico, color, num, label) => `<div class="stat"><span class="ico ${color}"><i class="fas ${ico}"></i></span><div><b>${num}</b><small>${label}</small></div></div>`;
  $('stats').innerHTML = tile('fa-hourglass-half', 'amber', n('PENDING'), 'Pending') + tile('fa-spinner', 'blue', n('IN_PROGRESS'), 'In progress') + tile('fa-circle-check', 'green', n('COMPLETED'), 'Completed');

  const next = tasks.filter(t => t.task_status !== 'COMPLETED').slice(0, 6);
  $('next').innerHTML = next.length ? '<ul class="list-rows">' + next.map(t =>
    `<li>${whoHTML(t.profiles?.full_name, pretty(t.task_type) + ' | ' + fmtDate(t.created_at), t.profiles?.photo_url)}<span class="badge ${TASK_BADGE[t.task_status]}">${TASK_LABEL[t.task_status]}</span><a class="btn btn-outline btn-sm" href="my-tasks.html">Open</a></li>`).join('') + '</ul>'
    : emptyState('fa-mug-hot', 'All clear', 'New tasks from the admin will show up here.');
} catch (err) {
  $('next').innerHTML = emptyState('fa-triangle-exclamation', 'Could not load tasks', esc(err.message));
}
