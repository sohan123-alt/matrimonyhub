import { supabase } from '../config/supabase.js';
import { updatePassword } from '../services/auth.service.js';
import { showToast } from '../utils/toast.js';
import { initPasswordToggles, setLoading, showAlert, hideAlert } from '../utils/ui.js';

const $ = id => document.getElementById(id);
const form = $('resetForm'), alertBox = $('alert'), btn = $('submitBtn');
let ready = false;
initPasswordToggles();

// Email er link e click korle Supabase PASSWORD_RECOVERY event dey
supabase.auth.onAuthStateChange(event => {
  if (event === 'PASSWORD_RECOVERY') { ready = true; $('waiting').hidden = true; form.hidden = false; }
});
setTimeout(() => { if (!ready) { $('waiting').hidden = true; $('invalid').hidden = false; } }, 2500);

form.addEventListener('submit', async e => {
  e.preventDefault();
  hideAlert(alertBox);
  if (form.password.value.length < 8) return showAlert(alertBox, 'Password must be at least 8 characters.');
  if (form.password.value !== form.confirm.value) return showAlert(alertBox, 'Passwords do not match.');
  setLoading(btn, true, 'Saving...');
  try {
    await updatePassword(form.password.value);
    await supabase.auth.signOut();
    showToast('Password updated. Please log in.', 'success');
    setTimeout(() => { location.href = 'login.html'; }, 1200);
  } catch (err) {
    showAlert(alertBox, err.message);
    setLoading(btn, false);
  }
});
