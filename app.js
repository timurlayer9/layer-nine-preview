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

// Scroll-linked background flow: interpolate the body background between
// section colors ([data-bg]) so differently-coloured sections blend smoothly.
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = Array.from(document.querySelectorAll('[data-bg]'));
  if (!els.length) return;

  document.documentElement.classList.add('bg-flow');

  const hex2rgb = (h) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const ease = (t) => t * t * (3 - 2 * t); // smoothstep

  let stops = [];
  const measure = () => {
    stops = els
      .map((el) => ({
        pos: el.getBoundingClientRect().top + window.scrollY,
        c: hex2rgb(el.dataset.bg),
      }))
      .sort((a, b) => a.pos - b.pos);
  };

  let ticking = false;
  const apply = () => {
    ticking = false;
    if (!stops.length) return;
    const ref = window.scrollY + window.innerHeight * 0.5;
    let c = stops[0].c;
    for (let i = 1; i < stops.length; i++) {
      const gap = stops[i].pos - stops[i - 1].pos;
      const w = Math.min(window.innerHeight * 0.6, Math.max(240, gap * 0.5));
      const t = Math.min(1, Math.max(0, (ref - (stops[i].pos - w * 0.5)) / w));
      if (t <= 0) break;
      const e = ease(t);
      const n = stops[i].c;
      c = [c[0] + (n[0] - c[0]) * e, c[1] + (n[1] - c[1]) * e, c[2] + (n[2] - c[2]) * e];
    }
    document.body.style.backgroundColor = `rgb(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0})`;
  };
  const requestApply = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(apply);
    }
  };

  window.addEventListener('scroll', requestApply, { passive: true });
  window.addEventListener('resize', () => { measure(); requestApply(); }, { passive: true });
  window.addEventListener('load', () => { measure(); requestApply(); });
  measure();
  apply();
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

  // confirmation modal
  const modal = document.getElementById('formModal');
  const openModal = () => {
    modal.hidden = false;
    modal.querySelector('[data-close].pill').focus();
  };
  const closeModal = () => { modal.hidden = true; };
  if (modal) {
    modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });
  }

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
      if (resp.ok) {
        form.reset();
        setStatus('', false);
        if (modal) openModal();
        else setStatus(form.dataset.msgSuccess, false);
        return;
      }
      // Server rejected the email address itself: show it, no fallback.
      const body = await resp.json().catch(() => ({}));
      if (resp.status === 400 && body.error === 'email_domain') {
        emailField.classList.add('is-invalid');
        setStatus(form.dataset.msgBademail, true);
        return;
      }
      throw new Error(String(resp.status));
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
