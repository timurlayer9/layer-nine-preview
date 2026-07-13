// Layer Nine — site v2

// Nav border on scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 12);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Pinned scrollytelling: the path
(() => {
  const track = document.getElementById('scrolly');
  const viz = document.getElementById('viz');
  if (!track || !viz) return;

  const stages = Array.from(track.querySelectorAll('.scrolly__stage'));
  const railFill = document.getElementById('railFill');
  const squares = Array.from(track.querySelectorAll('.sq-step'));
  const STAGE_COUNT = 4;
  let current = 0;
  let ticking = false;

  const update = () => {
    ticking = false;
    if (track.offsetHeight === 0) return; // hidden (mobile / reduced motion)
    const rect = track.getBoundingClientRect();
    const total = track.offsetHeight - window.innerHeight;
    const progress = Math.max(0, Math.min(1, -rect.top / total));
    const stage = Math.min(STAGE_COUNT - 1, Math.floor(progress * STAGE_COUNT));

    if (railFill) railFill.style.width = `${progress * 100}%`;
    squares.forEach((sq, i) => sq.classList.toggle('is-on', i <= stage));

    if (stage !== current) {
      current = stage;
      viz.dataset.stage = String(stage);
      stages.forEach((el, i) => el.classList.toggle('is-active', i === stage));
    }
  };

  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  update();
})();

// Pinned approach steps
(() => {
  const track = document.getElementById('apScrolly');
  const list = document.getElementById('apSteps');
  if (!track || !list) return;

  const steps = Array.from(list.querySelectorAll('.step'));
  let current = -1;
  let ticking = false;

  const update = () => {
    ticking = false;
    if (track.offsetHeight === 0) return; // hidden (mobile / reduced motion)
    const rect = track.getBoundingClientRect();
    const total = track.offsetHeight - window.innerHeight;
    const progress = Math.max(0, Math.min(1, -rect.top / total));
    const active = Math.min(steps.length - 1, Math.floor(progress * steps.length));
    if (active !== current) {
      current = active;
      steps.forEach((el, i) => el.classList.toggle('is-on', i <= active));
    }
  };

  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  update();
})();

// Reveal on scroll
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  reveals.forEach((el) => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  // Stagger siblings that share a parent
  const groups = new Map();
  reveals.forEach((el) => {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, 0);
    const i = groups.get(parent);
    el.style.transitionDelay = `${Math.min(i * 70, 350)}ms`;
    groups.set(parent, i + 1);
    io.observe(el);
  });
}
