export const taka = n => '\u09F3' + Number(n || 0).toLocaleString('en-US');
export const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
export const initials = n => (n || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pretty = s => s ? String(s).replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()) : '-';

export const PAY_BADGE = { PAID: ['badge-paid', 'Paid'], PENDING: ['badge-pending', 'In review'], FAILED: ['badge-failed', 'Failed'] };
export const TASK_LABEL = { PENDING: 'Pending', IN_PROGRESS: 'In progress', COMPLETED: 'Completed' };
export const TASK_BADGE = { PENDING: 'badge-pending', IN_PROGRESS: 'badge-info', COMPLETED: 'badge-paid' };
export const monthKey = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'); };
