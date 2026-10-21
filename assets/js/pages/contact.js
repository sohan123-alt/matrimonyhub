import { showToast } from '../utils/toast.js';
import { isEmail } from '../utils/ui.js';

const form = document.getElementById('contactForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  const name = form.name.value.trim(), email = form.email.value.trim(), msg = form.message.value.trim();
  if (name.length < 2 || !isEmail(email) || msg.length < 10) return showToast('Please fill in your name, a valid email and a message.', 'error');
  // Backend lagbe na: user er email app e prefilled message khule
  const body = msg + '\n\n' + name + '\n' + email;
  location.href = 'mailto:support@matrimonyhub.com?subject=' + encodeURIComponent(form.topic.value + ' | ' + name) + '&body=' + encodeURIComponent(body);
  showToast('Opening your email app...', 'info');
});
