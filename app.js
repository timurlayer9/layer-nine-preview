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

// Contact form: POST to the edge endpoint, fall back to a prefilled email
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const status = form.querySelector('.form__status');
  const emailField = form.querySelector('[name="email"]');
  const companyField = form.querySelector('[name="company"]');

  const setStatus = (msg, isError) => {
    status.textContent = msg;
    status.classList.toggle('is-error', !!isError);
  };

  const mailtoFallback = (data) => {
    const subject = `${form.dataset.subject} — ${data.company}`;
    const body = [
      `Company: ${data.company}`,
      `Email: ${data.email}`,
      data.name ? `Name: ${data.name}` : '',
      data.help ? `\n${data.help}` : '',
    ].filter(Boolean).join('\n');
    window.location.href = `mailto:luce@layer-nine.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      company: companyField.value.trim(),
      email: emailField.value.trim(),
      name: form.querySelector('[name="name"]').value.trim(),
      help: form.querySelector('[name="help"]').value.trim(),
      website: form.querySelector('[name="website"]').value, // honeypot
      page: location.pathname,
    };

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email);
    companyField.classList.toggle('is-invalid', !data.company);
    emailField.classList.toggle('is-invalid', !emailOk);
    if (!data.company || !emailOk) {
      setStatus(form.dataset.msgInvalid, true);
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    setStatus('…');

    try {
      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error(String(resp.status));
      form.classList.add('is-sent');
      setStatus(form.dataset.msgSuccess, false);
    } catch (err) {
      mailtoFallback(data);
      setStatus(form.dataset.msgError, true);
    } finally {
      button.disabled = false;
    }
  });
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
