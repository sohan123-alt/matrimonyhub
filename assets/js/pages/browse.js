import { requireAuth } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { getMyProfile, listProfiles, PAGE_SIZE } from '../services/profile.service.js';
import { profileCard, skeletonCards, emptyState } from '../components/profile-card.js';
import { esc } from '../utils/formatters.js';

const { user } = await requireAuth(['USER']);
initShell({ active: 'browse', title: 'Browse profiles', user });

const form = document.getElementById('filters');
const grid = document.getElementById('grid');
const count = document.getElementById('count');
const pager = document.getElementById('pager');
let page = 1;

const mine = await getMyProfile(user.id);
if (mine) form.gender.value = mine.gender === 'MALE' ? 'FEMALE' : 'MALE';

function filters() {
  const v = n => form[n].value.trim();
  return { gender: v('gender'), ageMin: v('ageMin'), ageMax: v('ageMax'), religion: v('religion'), marital: v('marital'), city: v('city') };
}

async function load() {
  grid.className = 'cards'; grid.innerHTML = skeletonCards(8); pager.innerHTML = '';
  try {
    const { rows, total } = await listProfiles(filters(), page, user.id);
    count.innerHTML = '<b>' + total + '</b> ' + (total === 1 ? 'profile' : 'profiles') + ' found';
    if (!rows.length) {
      grid.className = '';
      grid.innerHTML = emptyState('fa-magnifying-glass', 'No profiles match these filters', 'Try a wider age range or clear the city filter.', '<button class="btn btn-outline" id="clearBtn">Clear filters</button>');
      document.getElementById('clearBtn').onclick = () => { form.reset(); page = 1; load(); };
      return;
    }
    grid.innerHTML = rows.map(profileCard).join('');
    drawPager(Math.ceil(total / PAGE_SIZE));
  } catch (err) {
    grid.className = ''; grid.innerHTML = emptyState('fa-triangle-exclamation', 'Could not load profiles', esc(err.message));
  }
}

function drawPager(pages) {
  if (pages <= 1) return;
  const b = (label, p, opts = '') => `<button data-p="${p}" ${opts}>${label}</button>`;
  let html = b('<i class="fas fa-chevron-left"></i>', page - 1, page === 1 ? 'disabled aria-label="Previous"' : 'aria-label="Previous"');
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) html += b(i, i, i === page ? 'class="on"' : '');
    else if (Math.abs(i - page) === 2) html += '<button disabled>...</button>';
  }
  html += b('<i class="fas fa-chevron-right"></i>', page + 1, page === pages ? 'disabled aria-label="Next"' : 'aria-label="Next"');
  pager.innerHTML = html;
}
pager.addEventListener('click', e => {
  const btn = e.target.closest('button[data-p]');
  if (!btn || btn.disabled) return;
  page = Number(btn.dataset.p); load(); window.scrollTo({ top: 0, behavior: 'smooth' });
});
form.addEventListener('submit', e => { e.preventDefault(); page = 1; load(); });
form.addEventListener('reset', () => setTimeout(() => { page = 1; load(); }));
load();
