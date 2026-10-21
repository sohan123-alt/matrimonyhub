import { signIn, getSession, redirectByRole } from '../services/auth.service.js';
import { showToast } from '../utils/toast.js';
import { initPasswordToggles, setLoading, showAlert, hideAlert, isEmail } from '../utils/ui.js';

const form = document.getElementById('loginForm');
const alertBox = document.getElementById('alert');
const btn = document.getElementById('submitBtn');

initPasswordToggles();

// Already logged in thakle seedha dashboard e
getSession().then(s => { if (s) redirectByRole(s.user.id).catch(() => {}); });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert(alertBox);
  const email = form.email.value.trim();
  const password = form.password.value;

  if (!isEmail(email)) return showAlert(alertBox, 'Enter a valid email address.');
  if (!password) return showAlert(alertBox, 'Enter your password.');

  setLoading(btn, true, 'Logging in...');
  try {
    const { user } = await signIn(email, password);
    showToast('Welcome back!', 'success');
    await redirectByRole(user.id);
  } catch (err) {
    const msg = /invalid login/i.test(err.message) ? 'Email or password is incorrect.' : err.message;
    showAlert(alertBox, msg);
    setLoading(btn, false);
  }
});
