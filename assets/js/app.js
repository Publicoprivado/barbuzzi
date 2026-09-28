import { SITE, PROJECTS } from './data.js';
import { IMAGES } from './images.js';
import { mountShapes } from './shapes.js';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pct = (v, total) => `${((v / total) * 100).toFixed(4)}%`;
const rand = (min, max) => min + Math.random() * (max - min);
const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Site root ('/' locally or on a custom domain, '/barbuzzi/' on GitHub Pages) — set by the
// <base> tag that index.html writes before anything loads.
const BASE = new URL(document.baseURI).pathname;

const view = $('#view');
const shapesSvg = $('#shapes');
const setLayout = mountShapes(shapesSvg);
const MASK_EASE = 'cubic-bezier(0.25, 1, 0.5, 1)'; // quick start, soft landing — same as --mask-ease in main.css
const narrowMQ = matchMedia('(max-width: 760px)');
const portraitMQ = matchMedia('(max-aspect-ratio: 1/1)');
const hoverMQ = matchMedia('(hover: hover) and (pointer: fine)');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

// ── Content ────────────────────────────────────────────────────────────
const projects = PROJECTS.map((p) => {
  const project = { ...p };
  project.images = (IMAGES[p.slug] || []).map((im, i) => ({ ...im, n: i + 1, project }));
  return project;
}).filter((p) => p.images.length);

const bySection = (section) => projects.filter((p) => p.section === section);
const findProject = (section, slug) => projects.find((p) => p.section === section && p.slug === slug);
const coverOf = (p) => p.images[(p.cover || 1) - 1] || p.images[0];
const urlOf = (p) => (p.section === 'playground' ? null : `${BASE}${p.section}/${p.slug}`);

function imgTag(im, { sizes = '100vw', eager = false, style = '', fade = true } = {}) {
  const base = `${BASE}assets/img/${im.project.slug}/${im.f}`;
  const srcset = im.s.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
  const fallback = `${base}-${im.s[Math.min(1, im.s.length - 1)]}.webp`;
  const alt = im.project.images.length > 1 ? `${im.project.title} — ${im.n}` : im.project.title;
  return `<img${fade ? ' class="fade"' : ''} src="${fallback}" srcset="${srcset}" sizes="${sizes}" width="${im.w}" height="${im.h}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async" draggable="false" style="--ar:${im.w}/${im.h};${style}">`;
}

// Fade images in as they arrive (capture phase: load doesn't bubble).
document.addEventListener('load', (e) => { if (e.target.tagName === 'IMG') e.target.classList.add('is-loaded'); }, true);
const revealLoaded = (root) => $$('img.fade', root).forEach((img) => { if (img.complete && img.naturalWidth) img.classList.add('is-loaded'); });

// ── Layout patterns (design units, measured from the PDF) ──────────────
function columns({ W, cols, margin, gutter }) {
  const col = (W - 2 * margin - (cols - 1) * gutter) / cols;
  return { col, x: (c) => margin + c * (col + gutter), w: (s) => s * col + (s - 1) * gutter };
}

// Objects grid: the staggered 8-slot band from page 4 of the PDF, repeated.
// Slot: [column, span, y, 'p'ortrait 2:3 | 'l'andscape 1.4:1]
const GRID = {
  wide: {
    W: 1920, cols: 12, margin: 18, gutter: 17, band: 1350, pad: 90,
    slots: [[1, 2, 58, 'p'], [3, 3, 291, 'l'], [8, 3, 108, 'l'], [6, 2, 423, 'p'], [9, 2, 602, 'p'], [4, 2, 803, 'p'], [1, 3, 953, 'l'], [6, 3, 975, 'l']],
  },
  narrow: {
    W: 360, cols: 6, margin: 0, gutter: 10, band: 902, pad: 70,
    slots: [[0, 4, 0, 'p'], [2, 4, 375, 'l'], [0, 3, 564, 'p'], [3, 3, 620, 'p']],
  },
};
const RATIO = { p: 2 / 3, l: 1.4 };

// Playground: 1-column thumbnails dropped into random columns.
const PLAY = {
  wide: { W: 1920, cols: 12, margin: 18, gutter: 17, use: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], span: 1, start: [40, 260], gap: [40, 240], pad: 120 },
  narrow: { W: 360, cols: 4, margin: 0, gutter: 12, use: [0, 1, 2, 3], span: 1, start: [0, 60], gap: [14, 70], pad: 60 },
};

// ── Views ──────────────────────────────────────────────────────────────
function viewHome() {
  return `<h1 class="sr-only">${esc(SITE.name)} — ${esc(SITE.role)}</h1>`;
}

function viewInformation() {
  return `<section class="info"><div class="info__inner">
    <h1 class="sr-only">${esc(SITE.name)}</h1>
    <p class="info__role">${esc(SITE.role)}</p>
    <p class="info__bio">${esc(SITE.bio)}</p>
    <p class="info__contact"><a href="${esc(SITE.instagram)}" target="_blank" rel="noopener">instagram</a></p>
    <p class="info__clients">Worked with — ${SITE.clients.map(esc).join(', ')}.</p>
  </div></section>`;
}

function viewObjectsGrid() {
  const items = bySection('objects');
  const pat = narrowMQ.matches ? GRID.narrow : GRID.wide;
  const g = columns(pat);
  const boxes = items.map((_, i) => {
    const [c, s, y, r] = pat.slots[i % pat.slots.length];
    const w = g.w(s);
    return { x: g.x(c), y: Math.floor(i / pat.slots.length) * pat.band + y, w, h: w / RATIO[r] };
  });
  const H = Math.max(...boxes.map((b) => b.y + b.h)) + pat.pad;
  const cards = items.map((p, i) => {
    const b = boxes[i];
    const im = coverOf(p);
    const sizes = narrowMQ.matches ? `${Math.round((b.w / pat.W) * 100)}vw` : `${((b.w / pat.W) * 100).toFixed(1)}vw`;
    return `<a class="card reveal" href="${urlOf(p)}" style="left:${pct(b.x, pat.W)};top:${pct(b.y, H)};width:${pct(b.w, pat.W)};height:${pct(b.h, H)};--c:${im.c}">
      <span class="mask">${imgTag(im, { sizes, eager: i < 4 })}<span class="card__label label">${esc(p.title)}</span></span></a>`;
  });
  return `<h1 class="sr-only">Objects</h1><section class="grid" style="aspect-ratio:${pat.W}/${H.toFixed(1)}">${cards.join('')}</section>`;
}

function viewObjectsIndex() {
  const items = bySection('objects');
  return `<section class="index">
    <h1 class="sr-only">Objects — index</h1>
    <ul class="index__list">${items.map((p) => `<li><a class="label" href="${urlOf(p)}" data-slug="${p.slug}">${esc(p.title)}</a></li>`).join('')}</ul>
    <div class="index__preview" aria-hidden="true"></div>
  </section>`;
}

function mountObjectsIndex() {
  const list = $('.index__list');
  const preview = $('.index__preview');
  if (!list || !hoverMQ.matches) return;
  // Warm the small covers so the first hover is instant.
  bySection('objects').forEach((p) => { const im = coverOf(p); new Image().src = `${BASE}assets/img/${p.slug}/${im.f}-${im.s[0]}.webp`; });
  list.addEventListener('pointerover', (e) => {
    const a = e.target.closest('a[data-slug]');
    if (!a || a.classList.contains('is-hot')) return;
    $$('.is-hot', list).forEach((el) => el.classList.remove('is-hot'));
    const im = coverOf(findProject('objects', a.dataset.slug));
    preview.innerHTML = imgTag(im, { sizes: '24vw', eager: true, fade: false });
    preview.classList.toggle('is-broad', im.h / im.w < 1.1);
    preview.classList.add('is-on');
    a.classList.add('is-hot');
  });
  list.addEventListener('pointerleave', () => {
    preview.classList.remove('is-on');
    $$('.is-hot', list).forEach((el) => el.classList.remove('is-hot'));
  });
}

const FRAME_SIZES = {
  tall: '(max-width: 760px) calc(100vw - 60px), 32.2vw',
  broad: '(max-width: 760px) calc(100vw - 60px), 48.7vw',
  wide: '(max-width: 760px) calc(100vw - 60px), 65.2vw',
};

function viewProject(p) {
  const siblings = bySection(p.section);
  const next = siblings[(siblings.indexOf(p) + 1) % siblings.length];
  const meta = [
    p.description ? `<p>${esc(p.description)}</p>` : '',
    p.specs?.length ? `<ul class="project__specs">${p.specs.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : '',
  ].join('');
  const frames = p.images.map((im, i) => {
    const f = p.frames?.[im.n];
    const kind = f?.wide ? 'wide' : im.h / im.w > 1.1 ? 'tall' : 'broad';
    return `<figure class="frame reveal frame--${kind}" style="--c:${im.c}" data-i="${i}">
      <div class="mask">${imgTag(im, { sizes: FRAME_SIZES[kind], eager: i < 2, style: f?.pos ? `object-position:${f.pos}` : '' })}</div></figure>`;
  });
  return `<article class="project">
    <header class="project__head blend">
      <h1 class="project__title label">${esc(p.title)}</h1>
      <div class="project__meta">${meta}</div>
    </header>
    <div class="project__images">${frames.join('')}</div>
    ${next && next !== p ? `<a class="project__next" href="${urlOf(next)}">Next — ${esc(next.title)}</a>` : ''}
  </article>`;
}

function mountProject(p) {
  $('.project__images')?.addEventListener('click', (e) => {
    const fig = e.target.closest('.frame');
    if (fig) openLightbox(p.images.map((im) => ({ im })), +fig.dataset.i);
  });
}

function viewScenes() {
  const items = bySection('scenes');
  let k = 0;
  const blocks = items.map((p, pi) => {
    const frames = p.images.map((im) => `<figure class="scene__frame reveal" style="--c:${im.c}" data-k="${k++}">
      <div class="mask">${imgTag(im, { sizes: '(max-width: 760px) calc(100vw - 60px), 40.4vw', eager: pi < 2 })}</div></figure>`);
    return `<article class="scene" id="${p.slug}">
      <div class="scene__images">${frames.join('')}</div>
      <div class="scene__aside"><div class="scene__text blend">
        <h2 class="scene__title label"><a href="${urlOf(p)}">${esc(p.title)}</a></h2>
        ${p.description ? `<p class="scene__desc">${esc(p.description)}</p>` : ''}
      </div></div>
    </article>`;
  });
  return `<h1 class="sr-only">Scenes</h1><section class="scenes">${blocks.join('')}</section>`;
}

function mountScenes() {
  const all = bySection('scenes').flatMap((p) => p.images);
  $('.scenes')?.addEventListener('click', (e) => {
    const fig = e.target.closest('.scene__frame');
    if (fig) openFilmstrip(all, +fig.dataset.k);
  });
}

let playItems = [];
function viewPlayground() {
  const pat = narrowMQ.matches ? PLAY.narrow : PLAY.wide;
  const g = columns(pat);
  const w = g.w(pat.span);
  playItems = shuffle(projects.flatMap((p) => p.images));
  const bottoms = pat.use.map(() => rand(...pat.start));
  const boxes = playItems.map((im) => {
    // Lowest column wins, with a little jitter so the rhythm isn't too regular.
    let best = 0;
    bottoms.forEach((b, i) => { if (b + rand(0, 80) < bottoms[best]) best = i; });
    const y = bottoms[best] + rand(...pat.gap);
    const h = (w * im.h) / im.w;
    bottoms[best] = y + h;
    return { x: g.x(pat.use[best]), y, w, h };
  });
  const H = Math.max(...bottoms, pat.W * 0.5625) + pat.pad;
  const thumbs = playItems.map((im, i) => {
    const b = boxes[i];
    return `<button type="button" class="thumb" data-i="${i}" aria-label="${esc(im.project.title)}" style="left:${pct(b.x, pat.W)};top:${pct(b.y, H)};width:${pct(b.w, pat.W)};--c:${im.c}">
      ${imgTag(im, { sizes: narrowMQ.matches ? '22vw' : '7.4vw', eager: i < 12 })}</button>`;
  });
  return `<h1 class="sr-only">Playground</h1><section class="playground" style="aspect-ratio:${pat.W}/${H.toFixed(1)}">${thumbs.join('')}</section>`;
}

let playObserver = null;

// The thumbnails on screen when the page opens fade in while rising the same short
// distance, in random order. Everything further down is simply there when scrolled to.
function swoopIn(field) {
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;
  const thumbs = $$('.thumb', field);
  thumbs.forEach((t) => t.classList.add('is-waiting'));
  playObserver = new IntersectionObserver((entries) => {
    playObserver.disconnect(); // first look only
    thumbs.forEach((t) => t.classList.remove('is-waiting'));
    shuffle(entries.filter((en) => en.isIntersecting)).forEach((en, k) => {
      en.target.animate([
        { transform: 'translateY(40px)', opacity: 0 },
        { transform: 'none', opacity: 1 },
      ], { duration: 900, delay: k * 45 + rand(0, 200), easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' });
    });
  });
  thumbs.forEach((t) => playObserver.observe(t));
}

function mountPlayground() {
  const field = $('.playground');
  if (!field) return;
  swoopIn(field);
  let z = 10;
  field.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('.thumb');
    if (!t || e.pointerType === 'touch' || e.button !== 0) return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = +(t.dataset.dx || 0);
    const oy = +(t.dataset.dy || 0);
    let moved = false;
    t.setPointerCapture(e.pointerId);
    t.style.zIndex = ++z;
    const move = (ev) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (!moved && Math.hypot(dx, dy) > 4) { moved = true; t.classList.add('is-dragging'); }
      if (!moved) return;
      t.dataset.dx = ox + dx;
      t.dataset.dy = oy + dy;
      t.style.translate = `${ox + dx}px ${oy + dy}px`;
    };
    const up = () => {
      t.removeEventListener('pointermove', move);
      t.classList.remove('is-dragging');
      if (moved) t.dataset.dragged = '1';
    };
    t.addEventListener('pointermove', move);
    t.addEventListener('pointerup', up, { once: true });
    t.addEventListener('pointercancel', up, { once: true });
  });
  field.addEventListener('click', (e) => {
    const t = e.target.closest('.thumb');
    if (!t) return;
    if (t.dataset.dragged) { delete t.dataset.dragged; return; }
    openLightbox(playItems.map((im) => ({ im, caption: im.project.title, href: urlOf(im.project) })), +t.dataset.i);
  });
}

function viewNotFound() {
  return `<section class="notfound"><p>Not found — <a href="${BASE}">back to ${esc(SITE.wordmark)}</a></p></section>`;
}

// ── Overlays ───────────────────────────────────────────────────────────
let overlay = null;

function openOverlay(className, html, onKey) {
  closeOverlay(true);
  const el = document.createElement('div');
  el.className = `overlay ${className}`;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `${html}<button type="button" class="overlay__close">Close</button>`;
  document.body.appendChild(el);
  document.documentElement.classList.add('is-locked');
  const returnFocus = document.activeElement;
  const keys = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeOverlay(); } else onKey?.(e);
  };
  document.addEventListener('keydown', keys);
  $('.overlay__close', el).addEventListener('click', (e) => { e.stopPropagation(); closeOverlay(); });
  overlay = { el, keys, returnFocus };
  requestAnimationFrame(() => el.classList.add('is-open'));
  $('.overlay__close', el).focus({ preventScroll: true });
  return el;
}

function closeOverlay(immediate = false) {
  if (!overlay) return;
  const { el, keys, returnFocus, cleanup } = overlay;
  overlay = null;
  cleanup?.();
  document.removeEventListener('keydown', keys);
  document.documentElement.classList.remove('is-locked');
  if (immediate || reduceMotion.matches) el.remove();
  else { el.classList.remove('is-open'); setTimeout(() => el.remove(), 300); }
  returnFocus?.focus?.({ preventScroll: true });
}

// Single image, veiled page behind (PDF p.8). Click image → next, click veil → close.
function openLightbox(items, index) {
  let i = index;
  const el = openOverlay('lightbox', '<img class="lightbox__img" alt=""><p class="overlay__caption"></p>', (e) => {
    if (e.key === 'ArrowRight') show(i + 1);
    if (e.key === 'ArrowLeft') show(i - 1);
  });
  const img = $('.lightbox__img', el);
  const cap = $('.overlay__caption', el);
  function show(n) {
    i = (n + items.length) % items.length;
    const { im, caption, href } = items[i];
    const base = `${BASE}assets/img/${im.project.slug}/${im.f}`;
    img.srcset = im.s.map((w) => `${base}-${w}.webp ${w}w`).join(', ');
    img.sizes = `min(100vw, ${((97 * im.w) / im.h).toFixed(1)}vh)`;
    // Keep it masked until the new picture is ready, then unmask it from the top down.
    if (!reduceMotion.matches) {
      img.style.clipPath = 'inset(0 0 100% 0)';
      img.onload = img.onerror = () => {
        img.style.clipPath = '';
        img.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 450, easing: MASK_EASE });
      };
    }
    img.src = `${base}-${im.s[im.s.length - 1]}.webp`;
    img.alt = im.project.title;
    cap.innerHTML = caption ? (href ? `<a href="${href}">${esc(caption)}</a>` : esc(caption)) : '';
  }
  img.addEventListener('click', (e) => { e.stopPropagation(); show(i + 1); });
  cap.addEventListener('click', (e) => e.stopPropagation());
  el.addEventListener('click', () => closeOverlay());
  show(i);
}

// Horizontal strip of every scene image (PDF p.11).
// The track is moved with a transform and eased towards a target every frame: a drag
// follows the pointer with a little lag, a throw keeps its momentum, the ends stretch
// and spring back, and it always settles centred on an image. While it travels, the
// frames compress slightly and lean into the direction of motion.
function openFilmstrip(images, index) {
  const items = images.map((im, i) => `<figure class="strip__item" style="--c:${im.c}">${imgTag(im, { sizes: '70vw', eager: Math.abs(i - index) < 3 })}</figure>`);
  const html = `<div class="strip"><div class="strip__track">${items.join('')}</div></div><p class="overlay__caption"></p>`;
  const el = openOverlay('filmstrip', html, (e) => {
    if (e.key === 'ArrowRight') go(nearest(target) + 1);
    if (e.key === 'ArrowLeft') go(nearest(target) - 1);
  });
  const strip = $('.strip', el);
  const track = $('.strip__track', strip);
  const frames = $$('.strip__item', track);
  const cap = $('.overlay__caption', el);
  const still = reduceMotion.matches;
  revealLoaded(track);

  // x is the track offset; frame i is centred when x === posOf(i).
  let centers = [];
  let x = 0;
  let target = 0;
  let lastX = 0;
  let shown = -1;
  let raf = 0;
  let drag = null;
  let justDragged = false;
  let wheelTimer = 0;

  const measure = () => { centers = frames.map((f) => f.offsetLeft + f.offsetWidth / 2); };
  const posOf = (i) => strip.clientWidth / 2 - centers[i];
  const clampIndex = (i) => Math.max(0, Math.min(frames.length - 1, i));
  const bounds = () => [posOf(frames.length - 1), posOf(0)];
  const clampPos = (p) => { const [min, max] = bounds(); return Math.max(min, Math.min(max, p)); };
  const nearest = (p) => {
    let best = 0;
    for (let i = 1; i < centers.length; i++) if (Math.abs(posOf(i) - p) < Math.abs(posOf(best) - p)) best = i;
    return best;
  };
  const go = (i) => { target = posOf(clampIndex(i)); wake(); };
  const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };

  function label(i) {
    const p = images[i].project;
    cap.innerHTML = `<a href="${urlOf(p)}">${esc(p.title)}</a>`;
    if (!still) cap.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
    // Pull neighbours in ahead of time.
    for (let j = i - 3; j <= i + 3; j++) { const img = frames[j]?.querySelector('img'); if (img) img.loading = 'eager'; }
  }

  function frame() {
    raf = 0;
    const ease = still ? 1 : drag?.moved ? 0.32 : 0.11;
    x += (target - x) * ease;
    if (Math.abs(target - x) < 0.25) x = target;
    const v = x - lastX;
    lastX = x;
    track.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    const speed = still ? 0 : Math.max(-1, Math.min(1, v / 55));
    track.style.setProperty('--squash', (Math.abs(speed) * 0.07).toFixed(4));
    track.style.setProperty('--lean', `${(speed * -2.5).toFixed(3)}deg`);
    const i = nearest(target); // caption follows where the strip is heading
    if (i !== shown) { shown = i; label(i); }
    if (x !== target || Math.abs(v) > 0.02 || drag?.moved) raf = requestAnimationFrame(frame);
  }

  // Pointer drag (mouse, pen and touch — the strip owns horizontal gestures).
  strip.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.pointerType === 'mouse') e.preventDefault();
    justDragged = false;
    target = x; // grabbing a moving strip catches it
    drag = { id: e.pointerId, startX: e.clientX, from: x, moved: false, samples: [[e.timeStamp, e.clientX]] };
  });
  strip.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(dx) < 5) return;
      // Capture only once it's a real drag, so plain clicks still reach the image.
      drag.moved = true;
      strip.setPointerCapture(e.pointerId);
      strip.classList.add('is-dragging');
    }
    const [min, max] = bounds();
    let t = drag.from + dx;
    if (t > max) t = max + (t - max) * 0.35;
    else if (t < min) t = min + (t - min) * 0.35;
    target = t;
    drag.samples.push([e.timeStamp, e.clientX]);
    drag.samples = drag.samples.filter(([time]) => e.timeStamp - time < 100);
    wake();
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    strip.classList.remove('is-dragging');
    if (!d.moved) return;
    justDragged = true;
    // Throw: project the last ~100 ms of velocity forward, then settle on that frame.
    const [t0, x0] = d.samples[0];
    const [t1, x1] = d.samples[d.samples.length - 1];
    const velocity = t1 > t0 ? (x1 - x0) / (t1 - t0) : 0; // px per ms
    go(nearest(clampPos(target + velocity * 320)));
  };
  strip.addEventListener('pointerup', release);
  strip.addEventListener('pointercancel', release);

  // Wheel / trackpad anywhere on the overlay, snapping once it goes quiet.
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    target = clampPos(target - delta * (e.deltaMode === 1 ? 40 : 1));
    wake();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => go(nearest(target)), 160);
  }, { passive: false });

  strip.addEventListener('click', (e) => {
    e.stopPropagation();
    if (justDragged) { justDragged = false; return; }
    const f = e.target.closest('.strip__item');
    if (f) go(frames.indexOf(f));
    else closeOverlay();
  });
  cap.addEventListener('click', (e) => e.stopPropagation());
  el.addEventListener('click', () => closeOverlay());

  const onResize = () => { measure(); x = target = posOf(Math.max(0, shown)); wake(); };
  addEventListener('resize', onResize);
  overlay.cleanup = () => {
    cancelAnimationFrame(raf);
    clearTimeout(wheelTimer);
    removeEventListener('resize', onResize);
  };

  // Open by gliding in from the right onto the clicked image, the frames around it
  // unmasking one after another.
  measure();
  target = posOf(clampIndex(index));
  x = lastX = still ? target : target + Math.min(strip.clientWidth * 0.3, 420);
  wake();
  if (!still) {
    frames.slice(Math.max(0, index - 2), index + 4).forEach((f, k) => {
      f.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 550, delay: 40 + k * 60, easing: MASK_EASE, fill: 'backwards' });
    });
  }
}

// ── Router ─────────────────────────────────────────────────────────────
const SECTION_TITLES = { information: 'Information', objects: 'Objects', scenes: 'Scenes', playground: 'Playground' };

function parse(href) {
  const u = new URL(href, location.origin);
  const parts = u.pathname.slice(BASE.length).split('/').filter(Boolean).map(decodeURIComponent);
  const [a, b] = parts;
  if (!a) return { page: 'home', section: 'home' };
  if (parts.length === 1 && ['information', 'objects', 'scenes', 'playground'].includes(a)) {
    return { page: a, section: a, view: a === 'objects' && u.searchParams.get('view') === 'index' ? 'index' : 'grid' };
  }
  if (parts.length === 2 && (a === 'objects' || a === 'scenes')) {
    const project = findProject(a, b);
    if (project) return { page: 'project', section: a, project };
  }
  return { page: 'notfound', section: 'home' };
}

let route = null;

// Page images (.reveal) on screen when the page opens unmask from the top down with a
// slight settle-in zoom, cascading top-left to bottom-right. Everything below the fold
// loses .reveal and is simply there when scrolled to. Styles: main.css "Mask reveal".
let revealObserver = null;
function observeReveals(root) {
  const els = $$('.reveal', root);
  if (!els.length) return;
  revealObserver = new IntersectionObserver((entries) => {
    revealObserver.disconnect(); // first look only
    const onScreen = entries
      .filter((en) => en.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
      .map((en) => en.target);
    onScreen.forEach((el, k) => {
      el.style.setProperty('--delay', `${Math.min(40 + k * 70, 450)}ms`);
      el.classList.add('is-revealed');
    });
    els.forEach((el) => { if (!onScreen.includes(el)) el.classList.remove('reveal'); });
  });
  els.forEach((el) => revealObserver.observe(el));
}

function render() {
  closeOverlay(true);
  playObserver?.disconnect();
  playObserver = null;
  revealObserver?.disconnect();
  revealObserver = null;
  route = parse(location.href);
  const { page, section } = route;
  const body = document.body;
  body.dataset.page = page;
  body.dataset.section = section;
  body.dataset.route = page === 'objects' ? 'list' : '';
  setLayout(section);

  // Edge labels: the active section links "up" (project → section → home).
  $$('.edges a[data-section]').forEach((a) => {
    const s = a.dataset.section;
    const active = s === section;
    a.classList.toggle('is-active', active);
    a.toggleAttribute('aria-current', active);
    a.setAttribute('href', active ? (page === 'project' ? `${BASE}${s}` : BASE) : `${BASE}${s}`);
  });
  $$('.subnav a').forEach((a) => a.classList.toggle('is-active', a.dataset.view === route.view));

  const html = {
    home: viewHome,
    information: viewInformation,
    objects: () => (route.view === 'index' ? viewObjectsIndex() : viewObjectsGrid()),
    scenes: viewScenes,
    playground: viewPlayground,
    project: () => viewProject(route.project),
    notfound: viewNotFound,
  }[page]();
  view.innerHTML = html;
  revealLoaded(view);
  observeReveals(view);

  if (page === 'objects' && route.view === 'index') mountObjectsIndex();
  if (page === 'project') mountProject(route.project);
  if (page === 'scenes') mountScenes();
  if (page === 'playground') mountPlayground();

  document.title = page === 'project'
    ? `${route.project.title} — ${SITE.name}`
    : SECTION_TITLES[page] ? `${SECTION_TITLES[page]} — ${SITE.name}` : SITE.name;
}

function navigate(to) {
  if (to === location.pathname + location.search) return;
  history.replaceState({ ...(history.state || {}), y: scrollY }, '');
  history.pushState({ y: 0 }, '', to);
  render();
  scrollTo(0, 0);
  view.focus({ preventScroll: true });
}

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href]');
  if (!a || a.target || a.hasAttribute('download')) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || !url.pathname.startsWith(BASE) || url.pathname.startsWith(`${BASE}assets/`)) return;
  e.preventDefault();
  navigate(url.pathname + url.search);
});

addEventListener('popstate', (e) => {
  render();
  requestAnimationFrame(() => scrollTo(0, e.state?.y || 0));
});

// Esc on a project page goes back up to its section.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !overlay && route?.page === 'project') navigate(`${BASE}${route.section}`);
});

// Home: hovering an edge label previews that section's composition.
let previewTimer = 0;
$$('.edges a[data-section]').forEach((a) => {
  a.addEventListener('pointerenter', () => {
    if (route?.page !== 'home' || !hoverMQ.matches) return;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => setLayout(a.dataset.section), 90);
  });
  a.addEventListener('pointerleave', () => {
    clearTimeout(previewTimer);
    if (route?.page === 'home') setLayout('home');
  });
});

narrowMQ.addEventListener('change', () => {
  if (['objects', 'playground'].includes(route?.page)) render();
});

// On portrait screens let the composition fill the height and crop the sides.
const fitShapes = () => shapesSvg.setAttribute('preserveAspectRatio', portraitMQ.matches ? 'xMidYMid slice' : 'xMidYMid meet');
portraitMQ.addEventListener('change', fitShapes);
fitShapes();

$('#wordmark').textContent = SITE.wordmark;
history.scrollRestoration = 'manual';
render();
