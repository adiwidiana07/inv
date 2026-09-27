(function () {
  const configEl = document.querySelector('[data-tour-config]');
  if (!configEl) return;
  let config;
  try {
    config = JSON.parse(configEl.textContent);
  } catch (error) {
    return;
  }
  const root = document.querySelector('[data-tour-root]');
  if (!root) return;
  const spotlight = root.querySelector('[data-tour-spotlight]');
  const card = root.querySelector('[data-tour-card]');
  const title = root.querySelector('[data-tour-title]');
  const text = root.querySelector('[data-tour-text]');
  const progress = root.querySelector('[data-tour-progress]');
  const skip = root.querySelector('[data-tour-skip]');
  const previous = root.querySelector('[data-tour-prev]');
  const next = root.querySelector('[data-tour-next]');
  if (!spotlight || !card || !title || !text || !progress || !skip || !previous || !next) return;
  const kicker = root.querySelector('[data-tour-kicker]');
  if (kicker && config.kicker) kicker.textContent = config.kicker;
  const steps = (config.steps || []).filter((step) => step && step.target);
  if (!steps.length) return;
  const storageKey = config.key || 'karsa_tour_v1';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let active = false;
  let returnFocus = null;
  let settleTimer = 0;
  function isSeen() {
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch (error) {
      return false;
    }
  }
  function markSeen() {
    try {
      localStorage.setItem(storageKey, '1');
    } catch (error) {
      return;
    }
  }
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  function getTarget() {
    return document.querySelector(steps[current].target);
  }
  function placeCard(rect) {
    if (window.innerWidth <= 680) {
      card.style.top = '';
      card.style.right = '1rem';
      card.style.bottom = '1rem';
      card.style.left = '1rem';
      card.style.width = '';
      card.dataset.placement = 'bottom';
      return;
    }
    const cardRect = card.getBoundingClientRect();
    const gap = 16;
    const topSpace = rect.top;
    const bottomSpace = window.innerHeight - rect.bottom;
    const leftSpace = rect.left;
    const rightSpace = window.innerWidth - rect.right;
    let placement = 'bottom';
    if (topSpace > cardRect.height + gap + 16) placement = 'top';
    else if (bottomSpace > cardRect.height + gap + 16) placement = 'bottom';
    else if (rightSpace > cardRect.width + gap + 16) placement = 'right';
    else placement = 'left';
    let top = rect.bottom + gap;
    let left = rect.left + rect.width / 2 - cardRect.width / 2;
    if (placement === 'top') top = rect.top - cardRect.height - gap;
    if (placement === 'right') {
      top = rect.top + rect.height / 2 - cardRect.height / 2;
      left = rect.right + gap;
    }
    if (placement === 'left') {
      top = rect.top + rect.height / 2 - cardRect.height / 2;
      left = rect.left - cardRect.width - gap;
    }
    card.dataset.placement = placement;
    card.style.right = '';
    card.style.bottom = '';
    card.style.width = '';
    card.style.top = `${clamp(top, 16, Math.max(16, window.innerHeight - cardRect.height - 16))}px`;
    card.style.left = `${clamp(left, 16, Math.max(16, window.innerWidth - cardRect.width - 16))}px`;
  }
  function position() {
    if (!active) return;
    const target = getTarget();
    if (!target) return;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const padding = 8;
    const left = Math.max(8, rect.left - padding);
    const top = Math.max(8, rect.top - padding);
    const width = Math.min(window.innerWidth - left - 8, rect.width + padding * 2);
    const height = Math.min(window.innerHeight - top - 8, rect.height + padding * 2);
    if (width <= 0 || height <= 0) return;
    spotlight.style.left = `${left}px`;
    spotlight.style.top = `${top}px`;
    spotlight.style.width = `${width}px`;
    spotlight.style.height = `${height}px`;
    spotlight.style.opacity = '1';
    placeCard(rect);
  }
  function schedulePosition() {
    window.clearTimeout(settleTimer);
    let previousTop = null;
    let stableFrames = 0;
    const tick = () => {
      if (!active) return;
      const target = getTarget();
      if (!target) return;
      const rect = target.getBoundingClientRect();
      position();
      if (previousTop !== null && Math.abs(rect.top - previousTop) < 0.5) stableFrames += 1;
      else stableFrames = 0;
      previousTop = rect.top;
      if (stableFrames < 6) settleTimer = window.setTimeout(tick, 80);
    };
    settleTimer = window.setTimeout(tick, 60);
  }
  function reveal(step) {
    if (step.revealStep === undefined) return;
    document.dispatchEvent(new CustomEvent('karsa:tour-reveal', { detail: step.revealStep }));
  }
  function setStep(index) {
    current = clamp(index, 0, steps.length - 1);
    const step = steps[current];
    const target = document.querySelector(step.target);
    if (!target) {
      if (current < steps.length - 1) setStep(current + 1);
      else finish();
      return;
    }
    reveal(step);
    title.textContent = step.title;
    text.textContent = step.text;
    progress.textContent = `${current + 1} / ${steps.length}`;
    previous.disabled = current === 0;
    next.textContent = current === steps.length - 1 ? 'Selesai' : current === 0 ? 'Mulai' : 'Berikutnya';
    root.hidden = false;
    active = true;
    document.documentElement.classList.add('hg-tour-lock');
    const rect = target.getBoundingClientRect();
    if (window.karsaScroll) window.karsaScroll.release();
    const scrollTop = Math.max(0, window.scrollY + rect.top - (window.innerHeight - rect.height) / 2);
    window.scrollTo({ top: scrollTop, behavior: reducedMotion ? 'auto' : 'smooth' });
    schedulePosition();
    next.focus({ preventScroll: true });
  }
  function finish() {
    if (!active) return;
    active = false;
    window.clearTimeout(settleTimer);
    root.hidden = true;
    spotlight.style.opacity = '0';
    document.documentElement.classList.remove('hg-tour-lock');
    markSeen();
    document.dispatchEvent(new CustomEvent('karsa:tour-end'));
    if (returnFocus && document.contains(returnFocus) && typeof returnFocus.focus === 'function') {
      window.setTimeout(() => returnFocus.focus({ preventScroll: true }), 0);
    }
  }
  function nextStep() {
    if (current >= steps.length - 1) finish();
    else setStep(current + 1);
  }
  next.addEventListener('click', nextStep);
  previous.addEventListener('click', () => setStep(current - 1));
  skip.addEventListener('click', finish);
  function blockScroll(event) {
    if (active) event.preventDefault();
  }
  function blockScrollKey(event) {
    if (!active) return;
    if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'PageUp' || event.key === 'PageDown' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
    }
  }
  document.addEventListener('wheel', blockScroll, { passive: false });
  document.addEventListener('touchmove', blockScroll, { passive: false });
  document.addEventListener('keydown', (event) => {
    blockScrollKey(event);
    if (!active) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      finish();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextStep();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (current > 0) setStep(current - 1);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [skip, previous, next].filter((element) => !element.disabled);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  window.addEventListener('resize', position);
  window.addEventListener('orientationchange', position);
  window.addEventListener('scroll', position, { passive: true });
  window.addEventListener('load', position);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(position);
  const force = new URLSearchParams(window.location.search).has('tour');
  if (force || !isSeen()) window.setTimeout(() => {
    returnFocus = document.activeElement;
    document.dispatchEvent(new CustomEvent('karsa:tour-start'));
    setStep(0);
  }, 700);
})();
