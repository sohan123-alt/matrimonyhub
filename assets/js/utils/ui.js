export function initPasswordToggles() {
  document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = '<i class="fas ' + (show ? 'fa-eye-slash' : 'fa-eye') + '"></i>';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });
}

export function setLoading(btn, loading, label) {
  if (loading) {
    btn.dataset.label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch spin"></i> ' + (label || 'Please wait...');
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.label;
  }
}

export function showAlert(box, message, type = 'error') {
  box.className = 'alert show alert-' + type;
  box.querySelector('span').textContent = message;
}
export function hideAlert(box) { box.classList.remove('show'); }

export const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
