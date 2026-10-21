import { signUp } from '../services/auth.service.js';
import { showToast } from '../utils/toast.js';
import { initPasswordToggles, setLoading, showAlert, hideAlert, isEmail } from '../utils/ui.js';

const form = document.getElementById('registerForm');
const alertBox = document.getElementById('alert');
const btn = document.getElementById('submitBtn');
const meter = document.getElementById('meter');

initPasswordToggles();

function strength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return p ? Math.max(1, s) : 0;
}
form.password.addEventListener('input', e => { meter.dataset.level = strength(e.target.value); });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert(alertBox);
  const fullName = form.fullName.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;

  if (fullName.length < 3) return showAlert(alertBox, 'Enter your full name.');
  if (!isEmail(email)) return showAlert(alertBox, 'Enter a valid email address.');
  if (password.length < 8) return showAlert(alertBox, 'Password must be at least 8 characters.');
  if (password !== form.confirm.value) return showAlert(alertBox, 'Passwords do not match.');
  if (!form.terms.checked) return showAlert(alertBox, 'Please accept the terms to continue.');

  setLoading(btn, true, 'Creating account...');
  try {
    const { session } = await signUp({ email, password, fullName });
    if (session) {
      showToast('Account created!', 'success');
      setTimeout(() => { window.location.href = 'pages/user/create-profile.html'; }, 700);
    } else {
      // Email confirmation on thakle
      showAlert(alertBox, 'Account created. Check your email and confirm to log in.', 'success');
      form.reset(); meter.dataset.level = 0;
      setLoading(btn, false);
    }
  } catch (err) {
    showAlert(alertBox, /already registered/i.test(err.message) ? 'This email already has an account. Try logging in.' : err.message);
    setLoading(btn, false);
  }
});
