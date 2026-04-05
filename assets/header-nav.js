/**
 * header-nav.js — Lumière Beauty Theme
 * Controls: sticky scroll, mobile drawer, mega menu, search overlay,
 * predictive search, announcement bar dismiss.
 * Loaded with `defer`. Uses event delegation. No global scope pollution.
 */

'use strict';

/* ── Predictive Search ─────────────────────────────────────────────────────── */

class PredictiveSearch {
  constructor(inputEl, resultsEl) {
    this._input   = inputEl;
    this._results = resultsEl;
    this._cache   = new Map();
    this._abortCtrl = null;

    this._input.addEventListener('input', window.Lumiere.debounce(
      () => this._onInput(), 280
    ));
  }

  async _onInput() {
    const query = this._input.value.trim();
    if (query.length < 2) {
      this._results.hidden = true;
      return;
    }

    if (this._cache.has(query)) {
      this._render(this._cache.get(query));
      return;
    }

    // Cancel in-flight request
    this._abortCtrl?.abort();
    this._abortCtrl = new AbortController();

    try {
      const url = `${window.routes.predictiveSearch}?q=${encodeURIComponent(query)}&resources[type]=product,collection&resources[limit]=5&section_id=predictive-search`;
      const res = await fetch(url, { signal: this._abortCtrl.signal });
      if (!res.ok) return;
      const text = await res.text();
      const html = new DOMParser().parseFromString(text, 'text/html');
      const items = html.querySelectorAll('[data-predictive-item]');
      const data  = Array.from(items).map(el => ({
        url:   el.dataset.url,
        title: el.dataset.title,
        price: el.dataset.price,
        image: el.dataset.image
      }));
      this._cache.set(query, data);
      this._render(data);
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('[PredictiveSearch]', e);
    }
  }

  _render(items) {
    if (!items.length) {
      this._results.hidden = true;
      return;
    }

    this._results.innerHTML = items.map(item => `
      <a href="${item.url}" class="search-result-item">
        ${item.image ? `<img src="${item.image}" alt="" class="search-result-item__img" loading="lazy" width="48" height="48">` : ''}
        <div>
          <div class="search-result-item__title">${item.title}</div>
          ${item.price ? `<div class="search-result-item__price">${item.price}</div>` : ''}
        </div>
      </a>
    `).join('');
    this._results.hidden = false;
  }

  clear() {
    this._results.hidden = true;
    this._results.innerHTML = '';
  }
}

/* ── Search Overlay ────────────────────────────────────────────────────────── */

class SearchOverlay {
  constructor() {
    this._overlay   = document.querySelector('.search-overlay');
    this._input     = document.querySelector('.search-overlay__input');
    this._results   = document.querySelector('.search-overlay__results');
    this._closeBtn  = document.querySelector('.search-overlay__close');
    this._openBtns  = document.querySelectorAll('[data-open-search]');
    this._predictive = null;
    this._isOpen    = false;

    if (!this._overlay) return;

    if (this._input && this._results) {
      this._predictive = new PredictiveSearch(this._input, this._results);
    }

    this._openBtns.forEach(btn => btn.addEventListener('click', () => this.open()));
    this._closeBtn?.addEventListener('click', () => this.close());

    document.addEventListener('lumiere:overlay:close', () => this.close());
  }

  open() {
    this._isOpen = true;
    this._overlay.classList.add('is-open');
    this._overlay.removeAttribute('aria-hidden');
    document.dispatchEvent(new CustomEvent('lumiere:overlay:open'));
    setTimeout(() => this._input?.focus(), 80);
  }

  close() {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._overlay.classList.remove('is-open');
    this._overlay.setAttribute('aria-hidden', 'true');
    this._predictive?.clear();
    document.dispatchEvent(new CustomEvent('lumiere:overlay:close'));
  }
}

/* ── Mobile Navigation Drawer ──────────────────────────────────────────────── */

class MobileNav {
  constructor() {
    this._drawer    = document.querySelector('.mobile-nav');
    this._hamburger = document.querySelector('.header__hamburger');
    this._closeBtn  = document.querySelector('.mobile-nav__close');
    this._isOpen    = false;

    if (!this._drawer) return;

    this._hamburger?.addEventListener('click', () => this.toggle());
    this._closeBtn?.addEventListener('click',  () => this.close());

    // Sub-menu accordions
    this._drawer.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-mobile-sub-toggle]');
      if (!toggle) return;
      const sub = toggle.closest('.mobile-nav__item')?.querySelector('.mobile-nav__sub');
      if (!sub) return;
      const isOpen = sub.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('lumiere:overlay:close', () => this.close());
  }

  toggle() { this._isOpen ? this.close() : this.open(); }

  open() {
    this._isOpen = true;
    this._drawer.classList.add('is-open');
    this._drawer.removeAttribute('aria-hidden');
    this._hamburger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    document.dispatchEvent(new CustomEvent('lumiere:overlay:open'));
  }

  close() {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._drawer.classList.remove('is-open');
    this._drawer.setAttribute('aria-hidden', 'true');
    this._hamburger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
}

/* ── Mega Menu ─────────────────────────────────────────────────────────────── */

class MegaMenu {
  constructor() {
    this._menus  = document.querySelectorAll('[data-mega-menu]');
    this._active = null;
    this._timer  = null;

    this._menus.forEach(menu => {
      const trigger = menu.closest('.nav-item')?.querySelector('.nav-item__link');
      const panel   = document.querySelector(`[data-mega-panel="${menu.dataset.megaMenu}"]`);
      if (!trigger || !panel) return;

      trigger.addEventListener('mouseenter', () => {
        clearTimeout(this._timer);
        this._open(panel, trigger);
      });
      trigger.addEventListener('focus', () => this._open(panel, trigger));
      panel.addEventListener('mouseenter', () => clearTimeout(this._timer));

      const closeMenu = () => {
        this._timer = setTimeout(() => this._close(panel, trigger), 120);
      };
      trigger.addEventListener('mouseleave', closeMenu);
      panel.addEventListener('mouseleave',   closeMenu);
    });

    document.addEventListener('lumiere:overlay:close', () => {
      if (this._active) this._closeAll();
    });
  }

  _open(panel, trigger) {
    if (this._active && this._active !== panel) this._closeAll();
    panel.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    document.dispatchEvent(new CustomEvent('lumiere:overlay:open'));
    this._active = panel;
  }

  _close(panel, trigger) {
    panel.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    if (this._active === panel) {
      this._active = null;
      document.dispatchEvent(new CustomEvent('lumiere:overlay:close'));
    }
  }

  _closeAll() {
    document.querySelectorAll('.nav-mega.is-open').forEach(p => p.classList.remove('is-open'));
    document.querySelectorAll('[aria-expanded="true"]').forEach(t => t.setAttribute('aria-expanded', 'false'));
    this._active = null;
  }
}

/* ── Announcement Bar ──────────────────────────────────────────────────────── */

class AnnouncementBar {
  constructor() {
    const bar       = document.querySelector('.announcement-bar');
    const closeBtn  = document.querySelector('.announcement-bar__close');
    const storageKey = 'lumiere-announcement-dismissed';

    if (!bar) return;

    // Check if dismissed in this session
    if (sessionStorage.getItem(storageKey)) {
      bar.hidden = true;
      return;
    }

    closeBtn?.addEventListener('click', () => {
      bar.style.transition = 'max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease';
      bar.style.maxHeight  = bar.scrollHeight + 'px';
      requestAnimationFrame(() => {
        bar.style.maxHeight = '0';
        bar.style.opacity   = '0';
        bar.style.padding   = '0';
      });
      bar.addEventListener('transitionend', () => {
        bar.hidden = true;
      }, { once: true });
      sessionStorage.setItem(storageKey, '1');
    });
  }
}

/* ── Cart Icon Updater ─────────────────────────────────────────────────────── */

class CartIconUpdater {
  constructor() {
    this._counts = document.querySelectorAll('.cart-count');
    document.addEventListener('lumiere:cart:updated', (e) => {
      this._update(e.detail.count);
    });
  }

  _update(count) {
    this._counts.forEach(el => {
      el.textContent    = count;
      el.dataset.count  = count;
      // Trigger bump animation
      el.classList.remove('cart-count--bump');
      void el.offsetWidth; // reflow
      el.classList.add('cart-count--bump');
    });
  }
}

/* ── Init ──────────────────────────────────────────────────────────────────── */

function initHeaderNav() {
  new SearchOverlay();
  new MobileNav();
  new MegaMenu();
  new AnnouncementBar();
  new CartIconUpdater();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeaderNav);
} else {
  initHeaderNav();
}

// Re-init on Theme Editor section load
document.addEventListener('shopify:section:load', (e) => {
  const section = document.getElementById(`shopify-section-${e.detail.sectionId}`);
  if (section?.classList.contains('section-header') || section?.classList.contains('section-announcement')) {
    initHeaderNav();
  }
});
