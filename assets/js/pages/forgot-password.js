import { sendResetEmail } from '../services/auth.service.js';
import { setLoading, showAlert, hideAlert, isEmail } from '../utils/ui.js';

const form = document.getElementById('forgotForm');
const alertBox = document.getElementById('alert');
const btn = document.getElementById('submitBtn');

form.addEventListener('submit', async e => {
  e.preventDefault();
  hideAlert(alertBox);
  const email = form.email.value.trim();
  if (!isEmail(email)) return showAlert(alertBox, 'Enter a valid email address.');

  setLoading(btn, true, 'Sending...');
  try {
    await sendResetEmail(email);
    // Account ache kina bolbo na (privacy), shobar jonno ekoi message
    form.hidden = true;
    document.getElementById('sentEmail').textContent = email;
    document.getElementById('sent').hidden = false;
  } catch (err) {
    showAlert(alertBox, /rate|seconds/i.test(err.message) ? 'Too many requests. Please wait a minute and try again.' : err.message);
    setLoading(btn, false);
  }
});
