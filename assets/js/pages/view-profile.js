import { requireAuth, isActivePremium } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { getMyProfile, getProfileById, getPhone } from '../services/profile.service.js';
import { photoUrl } from '../services/upload.service.js';
import { emptyState } from '../components/profile-card.js';
import { esc, initials, pretty } from '../utils/formatters.js';

const { user } = await requireAuth(['USER']);
initShell({ active: '', title: 'Profile', user });
const root = document.getElementById('view');
const id = Number(new URLSearchParams(location.search).get('id'));

try {
  const [p, mine] = await Promise.all([id ? getProfileById(id) : null, getMyProfile(user.id)]);
  if (!p) {
    root.innerHTML = emptyState('fa-user-slash', 'Profile not found', 'This profile may have been removed.', '<a class="btn btn-primary" href="browse.html">Back to browse</a>');
  } else {
    const owner = p.user_id === user.id;
    const phone = await getPhone(p.id);
    const hue = 290 + (p.id % 7) * 9;
    const pic = p.photo_url
      ? `<img src="${esc(photoUrl(p.photo_url, 600))}" alt="${esc(p.full_name)}">`
      : `<div class="ph" style="font-size:5rem;background:linear-gradient(135deg,hsl(${hue} 70% 72%),hsl(${hue + 35} 60% 52%))">${esc(initials(p.full_name))}</div>`;
    const place = [p.city, p.state, p.country].filter(Boolean).join(', ');
    const block = (title, icon, text) => text ? `<section class="panel"><h2><i class="fas ${icon}" style="color:var(--rose);margin-right:.5rem"></i>${title}</h2><p class="prose">${esc(text)}</p></section>` : '';
    const row = (k, v) => `<div><dt>${k}</dt><dd>${esc(v || '-')}</dd></div>`;

    let contact;
    if (phone) {
      contact = `<div class="contact open"><div class="c-ico"><i class="fas fa-phone"></i></div>Contact number<b>${esc(phone)}</b></div>`;
    } else if (owner) {
      contact = `<div class="contact locked"><div class="c-ico"><i class="fas fa-phone"></i></div><b>No phone added</b><p>Add a number so premium members can reach you.</p><a href="edit-profile.html" class="btn btn-light btn-block">Add phone</a></div>`;
    } else if (isActivePremium(mine)) {
      contact = `<div class="contact open"><div class="c-ico"><i class="fas fa-phone-slash"></i></div>This member has not shared a phone number.</div>`;
    } else {
      contact = `<div class="contact locked"><div class="c-ico"><i class="fas fa-lock"></i></div><b style="font-family:var(--font-display);font-size:1.25rem">Contact details are hidden</b><p>Upgrade to premium to see phone numbers and reach out directly.</p><a href="premium.html" class="btn btn-primary btn-block"><i class="fas fa-crown"></i> See plans</a></div>`;
    }

    document.title = p.full_name + ' | MatrimonyHub';
    root.innerHTML = `
      <section class="panel pv-hero">
        <div class="pv-photo">${pic}</div>
        <div>
          <div class="badges">
            ${p.is_verified ? '<span class="badge badge-verified"><i class="fas fa-circle-check"></i> Verified</span>' : '<span class="badge badge-muted">Not verified yet</span>'}
            ${p.is_premium ? '<span class="badge badge-premium"><i class="fas fa-crown"></i> Premium</span>' : ''}
          </div>
          <h2>${esc(p.full_name)}, ${esc(p.age)}</h2>
          <div class="facts">
            ${p.occupation ? `<span><i class="fas fa-briefcase"></i>${esc(p.occupation)}</span>` : ''}
            ${place ? `<span><i class="fas fa-location-dot"></i>${esc(place)}</span>` : ''}
            ${p.education ? `<span><i class="fas fa-graduation-cap"></i>${esc(p.education)}</span>` : ''}
          </div>
          ${owner ? '<a class="btn btn-primary" href="edit-profile.html"><i class="fas fa-pen"></i> Edit profile</a>' : '<a class="btn btn-outline" href="browse.html"><i class="fas fa-arrow-left"></i> Back to browse</a>'}
        </div>
      </section>
      <div class="pv-grid">
        <div class="stack-gap">
          ${block('About', 'fa-user', p.about_me)}${block('Looking for', 'fa-heart', p.preferences)}${block('Family', 'fa-people-roof', p.family_details)}
        </div>
        <aside class="stack-gap">
          ${contact}
          <section class="panel"><h2>Details</h2><dl class="info-grid">
            ${row('Gender', pretty(p.gender))}${row('Religion', p.religion)}${row('Marital status', p.marital_status)}
            ${row('Height', p.height ? p.height + ' cm' : '')}${row('Weight', p.weight ? p.weight + ' kg' : '')}
          </dl></section>
        </aside>
      </div>`;
  }
} catch (err) {
  root.innerHTML = emptyState('fa-triangle-exclamation', 'Could not load this profile', esc(err.message));
}
