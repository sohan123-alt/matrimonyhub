import { esc } from '../utils/formatters.js';

export function openModal({ title, body = '', footer = '', wide = false, onClose }) {
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close"><i class="fas fa-xmark"></i></button></div>
    <div class="modal-body">${body}</div>${footer ? `<div class="modal-foot">${footer}</div>` : ''}</div>`;
  const onKey = e => { if (e.key === 'Escape') close(); };
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(); };
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(ov);
  return { el: ov, close, $: s => ov.querySelector(s) };
}

export function confirmModal({ title, text, confirmLabel = 'Confirm' }) {
  return new Promise(resolve => {
    let ok = false;
    const m = openModal({
      title, body: `<p>${text}</p>`,
      footer: `<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="okBtn">${confirmLabel}</button>`,
      onClose: () => resolve(ok)
    });
    m.$('#okBtn').onclick = () => { ok = true; m.close(); };
  });
}
