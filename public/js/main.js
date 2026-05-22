/* =========================================================
   APEX — main.js
   Loader, nav, reveal, counters, magnetic, modals,
   before/after slider, testimonials, forms, toasts, tilt.
   ========================================================= */

import './chat.js';

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  setYear();
  setupLoader();
  setupTheme();
  setupNavScroll();
  setupSmoothScroll();
  setupDrawer();
  setupReveal();
  setupCounters();
  setupMagnetic();
  setupServiceCards();
  setupServiceModal();
  setupPlanModal();
  setupReelModal();
  setupBillingSwitch();
  setupBeforeAfter();
  setupTestimonials();
  setupBookingForm();
  setupNewsletter();
  setupToTop();
  setupHintChat();
  setupHeroParallax();
  setupTilt();
});

/* ---------- 1. YEAR ---------- */
function setYear() {
  const el = $('#year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------- 2. LOADER ---------- */
function setupLoader() {
  const loader = $('#loader');
  if (!loader) return;
  const clip = $('#loaderClipRect');
  if (clip) {
    let w = 0;
    const target = 200;
    const dur = 1300;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      w = eased * target;
      clip.setAttribute('width', w);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const dismiss = () => {
    loader.classList.add('is-out');
    setTimeout(() => loader.remove(), 700);
  };
  if (document.readyState === 'complete') setTimeout(dismiss, 1400);
  else window.addEventListener('load', () => setTimeout(dismiss, 800));
}

/* ---------- 3. THEME ---------- */
function setupTheme() {
  const btn = $('#themeToggle');
  if (!btn) return;
  const saved = localStorage.getItem('apex.theme');
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
  btn.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('apex.theme', 'dark');
      toast('Tema scuro · benvenuto nel lato forte', { icon: '🌑' });
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('apex.theme', 'light');
      toast('Tema chiaro attivato', { icon: '☀' });
    }
  });
}

/* ---------- 4. NAV ---------- */
function setupNavScroll() {
  const nav = $('#nav');
  if (!nav) return;
  let last = -1;
  const update = () => {
    const y = window.scrollY;
    if (y > 10 !== last > 10) {
      nav.classList.toggle('is-scrolled', y > 10);
    }
    last = y;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });

  const links = $$('[data-nav]').filter(a => a.getAttribute('href')?.startsWith('#'));
  const sections = links
    .map(a => $(a.getAttribute('href')))
    .filter(Boolean);

  const map = new Map();
  links.forEach(l => {
    const id = l.getAttribute('href');
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(l);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const id = '#' + e.target.id;
        document.querySelectorAll('.nav__links a.is-active').forEach(a => a.classList.remove('is-active'));
        const targets = map.get(id);
        targets?.forEach(a => {
          if (a.closest('.nav__links')) a.classList.add('is-active');
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach(s => io.observe(s));
}

/* ---------- 5. SMOOTH SCROLL ---------- */
function setupSmoothScroll() {
  const navH = 76;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#' || href.length < 2) return;
    const target = $(href);
    if (!target) return;
    e.preventDefault();

    const drawer = $('#drawer');
    if (drawer?.classList.contains('is-open')) closeDrawer();

    const y = target.getBoundingClientRect().top + window.scrollY - navH + 1;
    window.scrollTo({ top: y, behavior: prefersReduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', href);
  });
}

/* ---------- 6. DRAWER (mobile) ---------- */
let drawerOpen = false;
function openDrawer() {
  drawerOpen = true;
  $('#drawer').classList.add('is-open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  $('#burger').setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  drawerOpen = false;
  $('#drawer').classList.remove('is-open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  $('#burger').setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
function setupDrawer() {
  const burger = $('#burger');
  if (!burger) return;
  burger.addEventListener('click', () => drawerOpen ? closeDrawer() : openDrawer());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawerOpen) closeDrawer();
  });
}

/* ---------- 7. REVEAL ---------- */
function setupReveal() {
  const items = $$('[data-reveal]');
  if (!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.dataset.delay || '0', 10);
        setTimeout(() => e.target.classList.add('is-in'), delay);
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  items.forEach(el => io.observe(el));
}

/* ---------- 8. COUNTERS ---------- */
function setupCounters() {
  const items = $$('[data-counter]');
  if (!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCount(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  items.forEach(el => io.observe(el));
}
function animateCount(el) {
  const target = parseFloat(el.dataset.counter);
  const isFloat = String(target).includes('.');
  const dur = 1600;
  const start = performance.now();
  const startVal = 0;
  const tick = (t) => {
    const p = Math.min(1, (t - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    const v = startVal + (target - startVal) * eased;
    el.textContent = isFloat ? v.toFixed(1) : Math.round(v).toString();
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- 9. MAGNETIC BUTTONS ---------- */
function setupMagnetic() {
  if (prefersReduced) return;
  const items = $$('.btn--magnetic');
  items.forEach(btn => {
    let raf = 0;
    const move = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / r.width;
        const y = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.transform = `translate(${x * 8}px, ${y * 8}px)`;
      });
    };
    const reset = () => {
      cancelAnimationFrame(raf);
      btn.style.transform = '';
    };
    btn.addEventListener('mousemove', move);
    btn.addEventListener('mouseleave', reset);
  });
}

/* ---------- 10. SERVICE CARDS (click → modal) ---------- */
function setupServiceCards() {
  $$('.svc').forEach(card => {
    card.addEventListener('click', () => openServiceModal(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openServiceModal(card);
      }
    });
  });
}

/* ---------- 11. SERVICE MODAL ---------- */
const modals = new Map();
function setupServiceModal() {
  const modal = $('#svcModal');
  if (!modal) return;
  modals.set('svc', modal);
  wireModalClose(modal);
}
function openServiceModal(card) {
  const modal = modals.get('svc');
  $('#svcModalTitle').textContent = card.dataset.svcTitle || 'Servizio';
  $('#svcModalDesc').textContent = card.dataset.svcDesc || '';
  const list = $('#svcModalBullets');
  list.innerHTML = '';
  (card.dataset.svcBullets || '').split('|').filter(Boolean).forEach(b => {
    const li = document.createElement('li');
    li.textContent = b.trim();
    list.appendChild(li);
  });
  openModal(modal);
}

/* ---------- 12. PLAN MODAL ---------- */
function setupPlanModal() {
  const modal = $('#planModal');
  if (!modal) return;
  modals.set('plan', modal);
  wireModalClose(modal);
  $$('.plan__cta').forEach(btn => {
    btn.addEventListener('click', () => {
      $('#planModalTitle').textContent = `Hai scelto ${btn.dataset.plan}`;
      $('#planModalDesc').textContent =
        `${btn.dataset.plan} a €${btn.dataset.planPrice}/mese. ` +
        `Per attivare il programma fissiamo una call gratuita di 20 minuti: ` +
        `capiamo se è davvero il piano giusto per te.`;
      openModal(modal);
    });
  });
}

/* ---------- 13. REEL MODAL ---------- */
function setupReelModal() {
  const modal = $('#reelModal');
  const trigger = $('#playReel');
  if (!modal || !trigger) return;
  modals.set('reel', modal);
  wireModalClose(modal);
  trigger.addEventListener('click', () => openModal(modal));
}

function wireModalClose(modal) {
  modal.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', (e) => {
      if (el.tagName !== 'A') e.preventDefault();
      closeModal(modal);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(modal);
  });
}
function openModal(modal) {
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => modal.querySelector('button, a, input')?.focus(), 200);
}
function closeModal(modal) {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ---------- 14. BILLING SWITCH ---------- */
function setupBillingSwitch() {
  const sw = $('#billingSwitch');
  if (!sw) return;
  const amounts = $$('.plan__amount');
  const periods = $$('.plan__period');
  sw.addEventListener('click', () => {
    const next = sw.getAttribute('aria-checked') !== 'true';
    sw.setAttribute('aria-checked', String(next));
    amounts.forEach(el => {
      const v = next ? el.dataset.priceQ : el.dataset.priceM;
      if (!v) return;
      animatePriceChange(el, parseInt(v, 10));
    });
    periods.forEach(el => {
      el.textContent = next ? '/mese · trim.' : '/mese';
    });
  });
}
function animatePriceChange(el, target) {
  const from = parseInt(el.textContent, 10) || 0;
  const dur = 500;
  const start = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (target - from) * eased);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- 15. BEFORE / AFTER SLIDER ---------- */
function setupBeforeAfter() {
  const viewer = $('#baViewer');
  if (!viewer) return;
  const handle = $('#baHandle');
  const after = viewer.querySelector('.ba__side--after');
  if (!handle || !after) return;

  let pct = 50;
  let dragging = false;

  const set = (p) => {
    pct = Math.max(0, Math.min(100, p));
    handle.style.left = `${pct}%`;
    after.style.width = `${pct}%`;
    handle.setAttribute('aria-valuenow', String(Math.round(pct)));
  };

  const fromEvent = (e) => {
    const r = viewer.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    set((x / r.width) * 100);
  };

  const start = (e) => { dragging = true; fromEvent(e); };
  const move  = (e) => { if (dragging) fromEvent(e); };
  const end   = () => { dragging = false; };

  viewer.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);

  viewer.addEventListener('touchstart', start, { passive: true });
  window.addEventListener('touchmove', move,  { passive: true });
  window.addEventListener('touchend',  end);

  viewer.addEventListener('click', (e) => {
    if (!dragging) fromEvent(e);
  });

  handle.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); set(pct - 4); }
    if (e.key === 'ArrowRight') { e.preventDefault(); set(pct + 4); }
    if (e.key === 'Home') { e.preventDefault(); set(0); }
    if (e.key === 'End') { e.preventDefault(); set(100); }
  });

  // Tease animation on first reveal
  const io = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      io.disconnect();
      let p = 50;
      const dir = 1;
      const teaseTo = (target, ms, then) => {
        const from = p;
        const start = performance.now();
        const tick = (t) => {
          const k = Math.min(1, (t - start) / ms);
          const eased = 1 - Math.pow(1 - k, 3);
          p = from + (target - from) * eased;
          set(p);
          if (k < 1) requestAnimationFrame(tick); else then?.();
        };
        requestAnimationFrame(tick);
      };
      teaseTo(85, 700, () => teaseTo(20, 800, () => teaseTo(50, 600)));
    }
  }, { threshold: 0.4 });
  io.observe(viewer);
}

/* ---------- 16. TESTIMONIALS ---------- */
function setupTestimonials() {
  const track = $('#tTrack');
  if (!track) return;
  const cards = $$('.t-card', track);
  const dotsWrap = $('#tDots');
  const prev = $('#tPrev');
  const next = $('#tNext');
  if (!cards.length) return;

  let idx = 0;
  let timer = null;

  cards.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Testimonianza ${i + 1}`);
    if (i === 0) b.classList.add('active');
    b.addEventListener('click', () => go(i));
    dotsWrap.appendChild(b);
  });
  const dots = $$('button', dotsWrap);

  const go = (i) => {
    idx = (i + cards.length) % cards.length;
    cards.forEach((c, j) => c.classList.toggle('active', j === idx));
    dots.forEach((d, j) => d.classList.toggle('active', j === idx));
    restart();
  };

  prev?.addEventListener('click', () => go(idx - 1));
  next?.addEventListener('click', () => go(idx + 1));

  const start = () => { timer = setInterval(() => go(idx + 1), 6500); };
  const stop  = () => { if (timer) { clearInterval(timer); timer = null; } };
  const restart = () => { stop(); start(); };

  const wrap = track.parentElement;
  wrap.addEventListener('mouseenter', stop);
  wrap.addEventListener('mouseleave', start);

  // Pause when out of view
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => e.isIntersecting ? start() : stop());
  }, { threshold: 0.2 });
  io.observe(track);

  // Swipe
  let sx = 0;
  track.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 60) go(idx + (dx < 0 ? 1 : -1));
  });
}

/* ---------- 17. BOOKING FORM ---------- */
function setupBookingForm() {
  const form = $('#bookingForm');
  if (!form) return;
  const submit = $('#bookingSubmit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.querySelectorAll(':invalid').forEach(el => {
        el.classList.add('is-invalid');
        const parent = el.closest('.field');
        if (parent) parent.classList.add('is-invalid');
      });
      const first = form.querySelector(':invalid');
      first?.focus();
      shake(submit);
      toast('Compila i campi richiesti', { variant: 'error' });
      return;
    }

    submit.classList.add('is-loading');
    submit.disabled = true;

    // Fake network — qui andrebbe la chiamata al backend reale
    await new Promise(r => setTimeout(r, 1100));

    submit.classList.remove('is-loading');
    submit.disabled = false;

    const data = Object.fromEntries(new FormData(form));
    form.reset();
    toast(`Grazie ${data.name?.split(' ')[0] || ''}! Marco ti risponderà entro 24h.`, {
      variant: 'success',
      duration: 5000,
    });
  });

  // Clear invalid on input
  form.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('is-invalid');
      el.closest('.field')?.classList.remove('is-invalid');
    });
  });
}
function shake(el) {
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-8px)' },
      { transform: 'translateX(8px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 360, easing: 'ease-out' }
  );
}

/* ---------- 18. NEWSLETTER ---------- */
function setupNewsletter() {
  const form = $('#newsForm');
  if (!form) return;
  const input = $('#newsEmail');
  const fb = $('#newsFeedback');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      fb.textContent = '✗ Email non valida';
      fb.style.color = 'var(--danger)';
      shake(input);
      return;
    }
    fb.textContent = '✓ Iscritto. A presto.';
    fb.style.color = 'var(--success)';
    input.value = '';
    setTimeout(() => { fb.textContent = ''; }, 4000);
  });
}

/* ---------- 19. TO TOP ---------- */
function setupToTop() {
  const btn = $('#toTop');
  if (!btn) return;
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }));
}

/* ---------- 20. HINT CHAT ---------- */
function setupHintChat() {
  const btn = $('#hintChat');
  if (!btn) return;
  btn.addEventListener('click', () => window.apexChat?.open());
}

/* ---------- 21. HERO PARALLAX ---------- */
function setupHeroParallax() {
  if (prefersReduced) return;
  const visual = document.querySelector('.hero__visual');
  const badges = $$('.hero__badge');
  if (!visual) return;
  let raf = 0;

  window.addEventListener('mousemove', (e) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = (e.clientX / window.innerWidth - 0.5) * 24;
      const y = (e.clientY / window.innerHeight - 0.5) * 24;
      visual.style.transform = `translateY(-50%) translate(${x}px, ${y}px)`;
      badges.forEach((b, i) => {
        const k = (i + 1) * 1.5;
        b.style.transform = `translate(${x * k}px, ${y * k}px)`;
      });
    });
  });

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < 800) {
      visual.style.opacity = String(Math.max(0.2, 1 - y / 600));
    }
  }, { passive: true });
}

/* ---------- 22. TILT 3D (cards) ---------- */
function setupTilt() {
  if (prefersReduced || matchMedia('(pointer: coarse)').matches) return;
  const tiltable = $$('.svc, .plan, .creds li, .info, .step');
  tiltable.forEach(card => {
    let raf = 0;
    card.addEventListener('mousemove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const amount = card.classList.contains('plan') ? 4 : 6;
        const existing = card.style.transform.replace(/\srotate3d\([^)]+\)/, '');
        card.style.transform = `${existing} rotate3d(${-y}, ${x}, 0, ${amount}deg)`;
        card.style.transformStyle = 'preserve-3d';
      });
    });
    card.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      card.style.transform = '';
    });
  });
}

/* ---------- 23. TOAST ---------- */
function toast(msg, opts = {}) {
  const host = $('#toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.className = `toast toast--${opts.variant || 'default'}`;

  const ICONS = {
    default: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    success: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 12 L11 15 L17 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  };
  el.innerHTML = `${ICONS[opts.variant] || ICONS.default}<span>${msg}</span>`;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  const duration = opts.duration || 3200;
  setTimeout(() => {
    el.classList.remove('is-in');
    setTimeout(() => el.remove(), 400);
  }, duration);
}

/* Expose for debugging */
window.apex = { toast };
