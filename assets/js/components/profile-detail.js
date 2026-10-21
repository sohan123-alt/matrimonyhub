import { esc, initials, pretty, fmtDate } from '../utils/formatters.js';
import { photoUrl } from '../services/upload.service.js';

export function whoHTML(name, sub, photo) {
  const av = photo
    ? `<span class="avatar-sm"><img src="${esc(photoUrl(photo, 80))}" alt=""></span>`
    : `<span class="avatar-sm">${esc(initials(name))}</span>`;
  return `<div class="who">${av}<div><b>${esc(name || 'Unnamed')}</b><small>${esc(sub || '')}</small></div></div>`;
}

export function profileDetailHTML(p, phone) {
  const av = p.photo_url ? `<span class="avatar-sm"><img src="${esc(photoUrl(p.photo_url, 140))}" alt=""></span>` : `<span class="avatar-sm">${esc(initials(p.full_name))}</span>`;
  const row = (k, v) => `<div><dt>${k}</dt><dd>${esc(v || '-')}</dd></div>`;
  const text = (t, v) => v ? `<div class="pd-text"><h5>${t}</h5><p>${esc(v)}</p></div>` : '';
  return `
    <div class="pd-top">${av}<div><h4>${esc(p.full_name)}, ${esc(p.age)}</h4>
      <div class="badges">
        ${p.is_verified ? '<span class="badge badge-verified"><i class="fas fa-circle-check"></i> Verified</span>' : '<span class="badge badge-pending">Not verified</span>'}
        ${p.is_premium ? '<span class="badge badge-premium"><i class="fas fa-crown"></i> Premium</span>' : ''}
      </div></div></div>
    <dl class="info-grid">
      ${row('Gender', pretty(p.gender))}${row('Religion', p.religion)}${row('Marital status', p.marital_status)}
      ${row('Education', p.education)}${row('Occupation', p.occupation)}
      ${row('Location', [p.city, p.state, p.country].filter(Boolean).join(', '))}
      ${row('Height / Weight', (p.height ? p.height + ' cm' : '-') + ' / ' + (p.weight ? p.weight + ' kg' : '-'))}
      ${row('Phone', phone || 'Not provided')}${row('Joined', fmtDate(p.created_at))}
    </dl>
    ${text('About', p.about_me)}${text('Looking for', p.preferences)}${text('Family', p.family_details)}`;
}
