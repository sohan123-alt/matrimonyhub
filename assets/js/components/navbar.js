const nav = document.querySelector('.navbar');
const toggle = document.getElementById('navToggle');
const menu = document.getElementById('navMenu');

if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    toggle.innerHTML = '<i class="fas ' + (open ? 'fa-xmark' : 'fa-bars') + '"></i>';
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
}
