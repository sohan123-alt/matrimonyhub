import { supabase } from '../config/supabase.js';
import { initials, esc } from '../utils/formatters.js';

const NAVS = {
  user: { label: 'Member', items: [
    ['dashboard', 'Dashboard', 'fa-gauge-high', 'dashboard.html'],
    ['browse', 'Browse profiles', 'fa-magnifying-glass', 'browse.html'],
    ['profile', 'My profile', 'fa-id-card', 'edit-profile.html'],
    ['premium', 'Premium', 'fa-crown', 'premium.html'],
    ['payments', 'My payments', 'fa-receipt', 'my-payments.html']] },
  admin: { label: 'Administrator', items: [
    ['dashboard', 'Dashboard', 'fa-gauge-high', 'dashboard.html'],
    ['users', 'Users', 'fa-users', 'users.html'],
    ['profiles', 'Profiles', 'fa-id-card', 'profiles.html'],
    ['tasks', 'Tasks', 'fa-list-check', 'tasks.html'],
    ['payments', 'Payments', 'fa-credit-card', 'payments.html'],
    ['reports', 'Reports', 'fa-chart-pie', 'reports.html']] },
  staff: { label: 'Staff', items: [
    ['dashboard', 'Dashboard', 'fa-gauge-high', 'dashboard.html'],
    ['tasks', 'My tasks', 'fa-list-check', 'my-tasks.html']] }
};

export function initShell({ active, title, user, variant = 'user' }) {
  const nav = NAVS[variant];
  const name = user.user_metadata?.full_name || user.email;
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');

  sidebar.innerHTML = `
    <a href="../../index.html" class="logo"><span class="logo-mark"><i class="fas fa-heart"></i></span>MatrimonyHub</a>
    <nav class="side-nav" aria-label="Main">
      ${nav.items.map(([key, label, icon, href]) => `<a href="${href}" class="${key === active ? 'active' : ''}"><i class="fas ${icon}"></i>${label}</a>`).join('')}
    </nav>
    <div class="side-user">
      <span class="avatar-sm">${esc(initials(name))}</span>
      <div><b>${esc(name)}</b><small>${nav.label}</small></div>
      <button class="logout-btn" id="logoutBtn" aria-label="Log out" title="Log out"><i class="fas fa-arrow-right-from-bracket"></i></button>
    </div>`;

  document.getElementById('topbar').innerHTML = `
    <button class="menu-btn" id="menuBtn" aria-label="Open menu"><i class="fas fa-bars"></i></button>
    <h1>${esc(title)}</h1>`;

  const toggle = open => { sidebar.classList.toggle('open', open); scrim.classList.toggle('show', open); };
  document.getElementById('menuBtn').addEventListener('click', () => toggle(true));
  scrim.addEventListener('click', () => toggle(false));
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.href = '../../login.html';
  });
  document.body.classList.add('ready');
}
