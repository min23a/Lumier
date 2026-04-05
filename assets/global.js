/**
 * global.js — Lumière Beauty Theme
 * Non-blocking global JS. Loaded with `defer`.
 * All classes use ES6 patterns, event delegation, no global pollution.
 */

'use strict';

/* ── Utilities ──────────────────────────────────────────────────────────── */

/**
 * Throttle a function call.
 * @param {Function} fn
 * @param {number} wait
 */
function throttle(fn, wait = 100) {
  let timer = null;
  return function (...args) {
    if (timer) return;
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, wait);
  };
}

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} wait
 */
function debounce(fn, wait = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Format a price according to Shopify's money format.
 * @param {number} cents
 */
function formatMoney(cents) {
  if (!window.moneyFormat) return cents;
  const value = (cents / 100).toFixed(2);
  return window.moneyFormat.replace('{{amount}}', value).replace('{{amount_no_decimals}}', Math.round(cents / 100));
}

/* ── Theme class ────────────────────────────────────────────────────────── */

class LumiereTheme {
  constructor() {
    this._observers = new Map();
    this._init();
  }

  _init() {
    this._setupScrollObserver();
    this._setupFocusTrap();
    this._setupBackdrop();
    this._initSectionLifecycle();
    this._setupA11y();

    // Re-init on Shopify section events (Theme Editor)
    document.addEventListener('shopify:section:load',   (e) => this._onSectionLoad(e));
    document.addEventListener('shopify:section:unload', (e) => this._onSectionUnload(e));
  }

  /* ── Scroll-driven reveal ─────────────────────────────────────────────── */
  _setupScrollObserver() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: make all elements visible immediately
      document.querySelectorAll('.animate-on-scroll, .stagger-children').forEach(el => {
        el.classList.add('is-visible');
      });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target); // fire once
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    );

    this._observers.set('scroll', io);
    this._observeScrollTargets(io);
  }

  _observeScrollTargets(io) {
    document
      .querySelectorAll('.animate-on-scroll, .stagger-children')
      .forEach((el) => io.observe(el));
  }

  /* ── Backdrop ─────────────────────────────────────────────────────────── */
  _setupBackdrop() {
    const backdrop = document.getElementById('Backdrop');
    if (!backdrop) return;

    backdrop.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('lumiere:backdrop:click'));
    });

    document.addEventListener('lumiere:overlay:open', () => backdrop.classList.add('is-open'));
    document.addEventListener('lumiere:overlay:close', () => backdrop.classList.remove('is-open'));
  }

  /* ── Focus trap helper ────────────────────────────────────────────────── */
  _setupFocusTrap() {
    this.trapFocus = (element) => {
      const focusableEls = element.querySelectorAll(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusableEls[0];
      const last  = focusableEls[focusableEls.length - 1];

      const handler = (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      element.addEventListener('keydown', handler);
      first?.focus();
      return () => element.removeEventListener('keydown', handler);
    };
  }

  /* ── Accessibility enhancements ───────────────────────────────────────── */
  _setupA11y() {
    // Escape key closes any active overlay
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.dispatchEvent(new CustomEvent('lumiere:overlay:close'));
      }
    });
  }

  /* ── Section lifecycle ────────────────────────────────────────────────── */
  _initSectionLifecycle() {
    // Components register themselves; lifecycle re-initialises them
  }

  _onSectionLoad(e) {
    const section = document.getElementById(`shopify-section-${e.detail.sectionId}`);
    if (!section) return;

    // Re-observe any new scroll targets within the loaded section
    const io = this._observers.get('scroll');
    if (io) this._observeScrollTargets(io);

    // Dispatch to child components
    section.dispatchEvent(new CustomEvent('section:load', { bubbles: false }));
  }

  _onSectionUnload(e) {
    const section = document.getElementById(`shopify-section-${e.detail.sectionId}`);
    if (!section) return;
    section.dispatchEvent(new CustomEvent('section:unload', { bubbles: false }));
  }
}

/* ── Disclosure (Accordion / Details) ──────────────────────────────────── */

class Disclosure extends HTMLElement {
  connectedCallback() {
    this._summary = this.querySelector('[data-disclosure-trigger]');
    this._panel   = this.querySelector('[data-disclosure-panel]');
    this._open    = false;

    this._summary?.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });
  }

  toggle() {
    this._open = !this._open;
    this._summary?.setAttribute('aria-expanded', this._open);
    if (this._panel) {
      this._panel.hidden = !this._open;
    }
  }

  open()  { if (!this._open) this.toggle(); }
  close() { if (this._open)  this.toggle(); }
}

customElements.define('lumiere-disclosure', Disclosure);

/* ── Custom Select ──────────────────────────────────────────────────────── */

class LumiereSelect extends HTMLElement {
  connectedCallback() {
    const select = this.querySelector('select');
    if (!select) return;
    select.addEventListener('change', () => {
      this.dispatchEvent(new CustomEvent('lumiere:select:change', {
        bubbles: true,
        detail: { value: select.value, name: select.name }
      }));
    });
  }
}

customElements.define('lumiere-select', LumiereSelect);

/* ── Quantity Input ─────────────────────────────────────────────────────── */

class QuantityInput extends HTMLElement {
  connectedCallback() {
    this._input   = this.querySelector('input[type="number"]');
    this._btnMinus = this.querySelector('[data-qty-minus]');
    this._btnPlus  = this.querySelector('[data-qty-plus]');

    this._btnMinus?.addEventListener('click', () => this._change(-1));
    this._btnPlus?.addEventListener('click',  () => this._change(+1));
  }

  _change(delta) {
    if (!this._input) return;
    const min = parseInt(this._input.min, 10) || 1;
    const max = parseInt(this._input.max, 10) || Infinity;
    const next = Math.min(max, Math.max(min, parseInt(this._input.value, 10) + delta));
    if (next === parseInt(this._input.value, 10)) return;
    this._input.value = next;
    this._input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

customElements.define('quantity-input', QuantityInput);

/* ── Toasts / Notifications ─────────────────────────────────────────────── */

class ToastManager {
  constructor() {
    this._container = this._createContainer();
    document.addEventListener('lumiere:toast', (e) => {
      this.show(e.detail.message, e.detail.type);
    });
  }

  _createContainer() {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.style.cssText = `
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: var(--z-toast);
      display: flex;
      flex-direction: column;
      gap: .5rem;
      pointer-events: none;
    `;
    document.body.appendChild(el);
    return el;
  }

  show(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `glass glass--heavy`;
    toast.style.cssText = `
      padding: .75rem 1.25rem;
      border-radius: 12px;
      font-size: .875rem;
      font-weight: 500;
      color: var(--color-text);
      pointer-events: all;
      animation: fadeUp .3s ease forwards;
      max-width: 320px;
    `;
    toast.textContent = message;
    this._container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      setTimeout(() => toast.remove(), 320);
    }, duration);
  }
}

/* ── Scroll-aware header ────────────────────────────────────────────────── */

class ScrollHeader {
  constructor(el) {
    if (!el) return;
    this._el         = el;
    this._lastScroll = 0;
    this._threshold  = 80;

    window.addEventListener('scroll', throttle(() => this._onScroll(), 80), { passive: true });
  }

  _onScroll() {
    const y = window.scrollY;
    if (y < this._threshold) {
      this._el.classList.remove('header--scrolled', 'header--hidden');
    } else {
      this._el.classList.add('header--scrolled');
      if (y > this._lastScroll) {
        this._el.classList.add('header--hidden');
      } else {
        this._el.classList.remove('header--hidden');
      }
    }
    this._lastScroll = y;
  }
}

/* ── Boot ───────────────────────────────────────────────────────────────── */

window.Lumiere = new LumiereTheme();
window.Lumiere.toasts = new ToastManager();
window.Lumiere.scrollHeader = new ScrollHeader(document.querySelector('.site-header'));
window.Lumiere.formatMoney  = formatMoney;
window.Lumiere.debounce     = debounce;
window.Lumiere.throttle     = throttle;
