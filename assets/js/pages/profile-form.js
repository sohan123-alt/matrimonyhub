import { requireAuth } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { getMyProfile, getPhone, saveProfile } from '../services/profile.service.js';
import { uploadPhoto, photoUrl } from '../services/upload.service.js';
import { showToast } from '../utils/toast.js';
import { setLoading } from '../utils/ui.js';

const mode = document.body.dataset.mode; // "create" | "edit"
const { user } = await requireAuth(['USER']);
initShell({ active: 'profile', title: mode === 'create' ? 'Create your profile' : 'Edit profile', user });

const form = document.getElementById('profileForm');
const prev = document.getElementById('photoPrev');
const fileIn = document.getElementById('photoFile');
const submitBtn = document.getElementById('submitBtn');
let photo = null;

const profile = await getMyProfile(user.id);
if (mode === 'create' && profile) location.replace('edit-profile.html');
if (mode === 'edit' && !profile) location.replace('create-profile.html');

// ---- Prefill ----
if (profile) {
  ['full_name', 'gender', 'age', 'marital_status', 'religion', 'height', 'weight', 'education', 'occupation', 'city', 'state', 'country', 'about_me', 'preferences', 'family_details']
    .forEach(k => { if (form[k] && profile[k] != null) form[k].value = profile[k]; });
  form.phone.value = (await getPhone(profile.id)) || '';
  photo = profile.photo_url;
  if (photo) prev.innerHTML = '<img src="' + photoUrl(photo, 200) + '" alt="Your photo">';
} else {
  form.full_name.value = user.user_metadata?.full_name || '';
}

// ---- Photo upload (Cloudinary) ----
fileIn.addEventListener('change', async () => {
  const file = fileIn.files[0];
  if (!file) return;
  prev.classList.add('busy');
  try {
    photo = await uploadPhoto(file);
    prev.innerHTML = '<img src="' + photoUrl(photo, 200) + '" alt="Your photo">';
    showToast('Photo uploaded', 'success');
  } catch (e) { showToast(e.message, 'error'); }
  prev.classList.remove('busy');
});

// ---- Steps (create mode only) ----
const steps = [...document.querySelectorAll('.form-step')];
const dots = [...document.querySelectorAll('.stepper li')];
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
let cur = 0;

function show(i) {
  cur = i;
  steps.forEach((s, idx) => { s.hidden = idx !== i; });
  dots.forEach((d, idx) => { d.classList.toggle('on', idx === i); d.classList.toggle('done', idx < i); });
  prevBtn.hidden = i === 0;
  nextBtn.hidden = i === steps.length - 1;
  submitBtn.hidden = i !== steps.length - 1;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function stepValid() {
  for (const el of steps[cur].querySelectorAll('input,select,textarea')) {
    if (!el.checkValidity()) { el.reportValidity(); return false; }
  }
  return true;
}
if (mode === 'create') {
  show(0);
  nextBtn.addEventListener('click', () => { if (stepValid()) show(cur + 1); });
  prevBtn.addEventListener('click', () => show(cur - 1));
}

// ---- Save ----
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (mode === 'create' && !stepValid()) return;
  const v = n => form[n].value.trim();
  const num = n => v(n) ? Number(v(n)) : null;
  const phone = v('phone');
  if (phone && !/^(\+?88)?01[3-9]\d{8}$/.test(phone)) return showToast('Enter a valid Bangladeshi mobile number.', 'error');

  const fields = {
    full_name: v('full_name'), age: num('age'), gender: v('gender'), marital_status: v('marital_status') || null,
    religion: v('religion') || null, height: num('height'), weight: num('weight'),
    education: v('education') || null, occupation: v('occupation') || null,
    city: v('city') || null, state: v('state') || null, country: v('country') || 'Bangladesh',
    about_me: v('about_me') || null, preferences: v('preferences') || null, family_details: v('family_details') || null,
    photo_url: photo
  };
  setLoading(submitBtn, true, 'Saving...');
  try {
    const saved = await saveProfile(user.id, fields, phone || null);
    showToast(mode === 'create' ? 'Profile created!' : 'Changes saved', 'success');
    setTimeout(() => { location.href = mode === 'create' ? 'dashboard.html' : 'view-profile.html?id=' + saved.id; }, 700);
  } catch (err) {
    showToast(err.message, 'error');
    setLoading(submitBtn, false);
  }
});
