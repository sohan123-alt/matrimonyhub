export function showToast(message, type = 'info') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const icons = { success: 'fa-circle-check', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.setAttribute('role', 'status');
  el.innerHTML = '<i class="fas ' + (icons[type] || icons.info) + '"></i><span></span>';
  el.querySelector('span').textContent = message;
  stack.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3500);
}
