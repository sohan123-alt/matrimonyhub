import { esc, initials } from '../utils/formatters.js';
import { photoUrl } from '../services/upload.service.js';

export function profileCard(p) {
  const hue = 290 + (p.id % 7) * 9;
  const pic = p.photo_url
    ? `<img src="${esc(photoUrl(p.photo_url, 480))}" alt="${esc(p.full_name)}" loading="lazy">`
    : `<div class="ph" style="background:linear-gradient(135deg,hsl(${hue} 70% 72%),hsl(${hue + 35} 60% 52%))">${esc(initials(p.full_name))}</div>`;
  const place = [p.city, p.state].filter(Boolean).join(', ');
  return `
  <a class="pcard" href="view-profile.html?id=${p.id}">
    <div class="pic">${pic}
      <div class="tags">
        ${p.is_verified ? '<span class="badge badge-verified"><i class="fas fa-circle-check"></i> Verified</span>' : ''}
        ${p.is_premium ? '<span class="badge badge-premium"><i class="fas fa-crown"></i></span>' : ''}
      </div>
    </div>
    <div class="body">
      <h3>${esc(p.full_name)}, ${esc(p.age)}</h3>
      <p class="job">${esc(p.occupation || 'Occupation not added')}</p>
      <div class="meta">
        ${place ? `<span><i class="fas fa-location-dot"></i>${esc(place)}</span>` : ''}
        ${p.religion ? `<span><i class="fas fa-star-and-crescent"></i>${esc(p.religion)}</span>` : ''}
        ${p.education ? `<span><i class="fas fa-graduation-cap"></i>${esc(p.education)}</span>` : ''}
      </div>
    </div>
  </a>`;
}

export const skeletonCards = n => Array.from({ length: n }, () => '<div class="skel skel-card"></div>').join('');

export const emptyState = (icon, title, text, action = '') =>
  `<div class="empty panel"><div class="e-ico"><i class="fas ${icon}"></i></div><h3>${title}</h3><p>${text}</p>${action}</div>`;
