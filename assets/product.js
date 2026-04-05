/**
 * product.js — Lumière Beauty Theme
 * Handles: gallery (thumbnails, slide transitions, zoom lightbox),
 * variant selection (button/select/swatch pickers), URL & history sync,
 * ATC intercept, sticky ATC bar, collapsible tabs.
 *
 * Loaded with `defer`. Self-contained ES6 classes, no global pollution.
 */

'use strict';

/* ── Utility ─────────────────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── ProductGallery ────────────────────────────────────────────────────────── */

class ProductGallery {
  constructor(el) {
    this._el      = el;
    this._slides  = $$('[data-gallery-slide]', el);
    this._thumbs  = $$('[data-gallery-thumb]', el);
    this._current = 0;
    this._zoom    = null;

    this._thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', () => this.goTo(i));
      thumb.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.goTo(i); }
      });
    });

    // Zoom
    const zoomBtn = $('[data-zoom-open]', el);
    if (zoomBtn) {
      this._zoom = new ProductZoom();
      zoomBtn.addEventListener('click', () => {
        const img = this._slides[this._current]?.querySelector('img');
        this._zoom.open(img?.src || '');
      });
    }

    // Keyboard navigation on main image
    el.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft')  this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    // Touch swipe
    this._initSwipe();
  }

  goTo(index) {
    if (index < 0 || index >= this._slides.length) return;
    this._slides[this._current]?.classList.remove('is-active');
    this._thumbs[this._current]?.classList.remove('is-active');
    this._thumbs[this._current]?.setAttribute('aria-selected', 'false');

    this._current = index;
    this._slides[this._current]?.classList.add('is-active');
    this._thumbs[this._current]?.classList.add('is-active');
    this._thumbs[this._current]?.setAttribute('aria-selected', 'true');
  }

  prev() { this.goTo((this._current - 1 + this._slides.length) % this._slides.length); }
  next() { this.goTo((this._current + 1) % this._slides.length); }

  /** Switch to the first slide matching a given variant media id */
  setVariantMedia(mediaId) {
    if (!mediaId) return;
    const idx = this._slides.findIndex(s => s.dataset.mediaId === String(mediaId));
    if (idx !== -1) this.goTo(idx);
  }

  _initSwipe() {
    let startX = 0;
    const main = $('[data-gallery-main]', this._el);
    if (!main) return;
    main.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend',   (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) dx < 0 ? this.next() : this.prev();
    });
  }
}

/* ── ProductZoom ───────────────────────────────────────────────────────────── */

class ProductZoom {
  constructor() {
    this._overlay = document.getElementById('ProductZoom');
    this._img     = $('[data-zoom-img]', this._overlay);
    this._close   = $('[data-zoom-close]', this._overlay);

    this._close?.addEventListener('click', () => this.close());
    this._overlay?.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._overlay?.classList.contains('is-open')) this.close();
    });
  }

  open(src) {
    if (!this._overlay) return;
    if (this._img) {
      this._img.src = src.replace(/_(pico|icon|thumb|small|compact|medium|large|grande|1024x1024|2048x2048|master)/i, '');
    }
    this._overlay.classList.add('is-open');
    this._overlay.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this._overlay?.classList.remove('is-open');
    this._overlay?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

/* ── VariantPicker ─────────────────────────────────────────────────────────── */

class VariantPicker {
  /**
   * @param {HTMLElement} el   — the [data-variant-picker] container
   * @param {object[]}   variants — product.variants JSON from data attribute
   * @param {object}    currentVariant — active variant JSON
   * @param {ProductGallery} gallery
   * @param {ProductForm}    form
   */
  constructor(el, variants, currentVariant, gallery, form) {
    this._el       = el;
    this._variants = variants;
    this._current  = currentVariant;
    this._gallery  = gallery;
    this._form     = form;

    // Collect option value selections
    this._selected = currentVariant
      ? currentVariant.options.slice()
      : [];

    this._bindEvents();
  }

  _bindEvents() {
    // Button-style pickers
    this._el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-option-btn]');
      if (!btn || btn.disabled) return;
      const { position, value } = btn.dataset;
      this._select(parseInt(position, 10) - 1, value, btn);
    });

    // Select dropdowns
    this._el.addEventListener('change', (e) => {
      const sel = e.target.closest('[data-option-select]');
      if (!sel) return;
      const position = parseInt(sel.dataset.position, 10) - 1;
      this._select(position, sel.value, sel);
    });
  }

  _select(optionIndex, value, triggerEl) {
    this._selected[optionIndex] = value;

    // Update active state on siblings in same option group
    const position = optionIndex + 1;
    $$(`[data-option-btn][data-position="${position}"]`, this._el).forEach(btn => {
      btn.classList.toggle('is-selected', btn.dataset.value === value);
      btn.setAttribute('aria-pressed', btn.dataset.value === value);
    });

    // Find matching variant
    const variant = this._findVariant(this._selected);
    this._current = variant;

    // Update availability of other options
    this._updateAvailability();

    // Propagate change
    this._onVariantChange(variant);
  }

  _findVariant(selectedOptions) {
    return this._variants.find(v =>
      v.options.every((opt, i) => opt === selectedOptions[i])
    ) || null;
  }

  _updateAvailability() {
    // For each option position, determine which values are available
    // given all *other* currently selected option values
    const optionCount = this._selected.length;

    for (let pos = 0; pos < optionCount; pos++) {
      const otherSelections = this._selected.filter((_, i) => i !== pos);

      $$(`[data-option-btn][data-position="${pos + 1}"]`, this._el).forEach(btn => {
        const testOptions = this._selected.slice();
        testOptions[pos] = btn.dataset.value;
        const available = this._variants.some(v =>
          v.options.every((opt, i) => {
            if (i === pos) return opt === btn.dataset.value;
            return i >= optionCount || opt === this._selected[i];
          }) && v.available
        );
        btn.disabled = !available;
        btn.setAttribute('aria-disabled', !available);
      });
    }
  }

  _onVariantChange(variant) {
    // Update gallery
    if (variant?.featured_media?.id) {
      this._gallery?.setVariantMedia(variant.featured_media.id);
    }

    // Update form hidden input
    this._form?.setVariant(variant);

    // Update URL without reload
    if (variant) {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    }

    // Dispatch event for price / ATC updates
    document.dispatchEvent(new CustomEvent('lumiere:variant:change', {
      bubbles: true,
      detail:  { variant }
    }));
  }
}

/* ── ProductForm ───────────────────────────────────────────────────────────── */

class ProductForm {
  constructor(el) {
    this._el         = el;
    this._variantInput = $('[name="id"]', el);
    this._qtyInput     = $('[data-product-qty]', el);
    this._atcBtn       = $('[data-atc-btn]', el);
    this._priceEl      = $('[data-product-price]', document);
    this._compareEl    = $('[data-product-compare-price]', document);
    this._priceBadge   = $('[data-product-price-badge]', document);

    // Bind ATC button — form submission is intercepted by cart.js globally
    // We handle the busy/error states here

    document.addEventListener('lumiere:variant:change', (e) => {
      this._onVariantChange(e.detail.variant);
    });
  }

  setVariant(variant) {
    if (this._variantInput) {
      this._variantInput.value = variant?.id || '';
    }
  }

  _onVariantChange(variant) {
    this._updatePrice(variant);
    this._updateATC(variant);
    this._updateStickyBar(variant);
  }

  _updatePrice(variant) {
    if (!variant) return;

    const price        = window.Lumiere?.formatMoney?.(variant.price) || '';
    const comparePrice = variant.compare_at_price > variant.price
      ? window.Lumiere?.formatMoney?.(variant.compare_at_price)
      : null;
    const pct = comparePrice
      ? Math.round((1 - variant.price / variant.compare_at_price) * 100)
      : null;

    if (this._priceEl) {
      this._priceEl.textContent = price;
      this._priceEl.classList.toggle('product-price__current--sale', !!comparePrice);
    }
    if (this._compareEl) {
      this._compareEl.textContent = comparePrice || '';
      this._compareEl.hidden = !comparePrice;
    }
    if (this._priceBadge) {
      this._priceBadge.textContent = comparePrice ? `-${pct}%` : '';
      this._priceBadge.hidden = !comparePrice;
    }
  }

  _updateATC(variant) {
    if (!this._atcBtn) return;
    const available = variant?.available;
    const exists    = !!variant;

    this._atcBtn.disabled = !available || !exists;
    this._atcBtn.textContent = !exists
      ? window.Lumiere?.t?.('sections.product.unavailable') || 'Unavailable'
      : !available
        ? window.Lumiere?.t?.('sections.product.sold_out') || 'Sold Out'
        : window.Lumiere?.t?.('sections.product.add_to_cart') || 'Add to Cart';
  }

  _updateStickyBar(variant) {
    const bar = document.getElementById('StickyATCBar');
    if (!bar) return;
    const priceEl = $('[data-sticky-price]', bar);
    if (priceEl && variant) {
      priceEl.textContent = window.Lumiere?.formatMoney?.(variant.price) || '';
    }
  }
}

/* ── CollapsibleTabs ───────────────────────────────────────────────────────── */

class CollapsibleTabs {
  constructor(el) {
    $$('[data-tab-trigger]', el).forEach(trigger => {
      trigger.addEventListener('click', () => {
        const tab = trigger.closest('[data-tab]');
        if (!tab) return;
        const isOpen = tab.classList.contains('product-tab--open');
        // Close all others in same container
        $$('[data-tab]', el).forEach(t => {
          t.classList.remove('product-tab--open');
          t.querySelector('[data-tab-trigger]')?.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          tab.classList.add('product-tab--open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }
}

/* ── StickyATCBar ──────────────────────────────────────────────────────────── */

class StickyATCBar {
  constructor() {
    this._bar    = document.getElementById('StickyATCBar');
    this._atcEl  = $('[data-atc-btn]');
    this._btn    = this._bar ? $('[data-sticky-atc-btn]', this._bar) : null;
    this._io     = null;

    if (!this._bar || !this._atcEl) return;

    // Mirror the main ATC button click
    this._btn?.addEventListener('click', () => {
      this._atcEl?.click();
    });

    this._io = new IntersectionObserver(([entry]) => {
      this._bar.classList.toggle('is-visible', !entry.isIntersecting);
    }, { threshold: 0, rootMargin: '0px 0px -80px 0px' });

    this._io.observe(this._atcEl);
  }

  destroy() { this._io?.disconnect(); }
}

/* ── ProductShare ──────────────────────────────────────────────────────────── */

class ProductShare {
  constructor(el) {
    el.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-share-btn]');
      if (!btn) return;
      const platform = btn.dataset.shareBtn;
      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(document.title);

      if (platform === 'native' && navigator.share) {
        try {
          await navigator.share({ title: document.title, url: window.location.href });
        } catch {}
        return;
      }

      const targets = {
        twitter:  `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        pinterest:`https://pinterest.com/pin/create/button/?url=${url}&description=${title}`,
        copy: null
      };

      if (platform === 'copy') {
        navigator.clipboard?.writeText(window.location.href).then(() => {
          document.dispatchEvent(new CustomEvent('lumiere:toast', {
            detail: { message: 'Link copied to clipboard!', type: 'success' }
          }));
        });
        return;
      }

      if (targets[platform]) {
        window.open(targets[platform], '_blank', 'width=600,height=400');
      }
    });
  }
}

/* ── ProductPage — orchestrator ────────────────────────────────────────────── */

class ProductPage {
  constructor() {
    const wrapper = document.querySelector('[data-product-page]');
    if (!wrapper) return;

    // Parse variants JSON from data attribute (set by Liquid)
    let variants     = [];
    let currentVariant = null;
    try {
      variants       = JSON.parse(wrapper.dataset.variants || '[]');
      currentVariant = JSON.parse(wrapper.dataset.currentVariant || 'null');
    } catch (e) {
      console.warn('[ProductPage] Could not parse variants JSON:', e);
    }

    // Initialise sub-components
    const galleryEl = wrapper.querySelector('[data-product-gallery]');
    const formEl    = wrapper.querySelector('[data-product-form]');
    const pickerEl  = wrapper.querySelector('[data-variant-picker]');
    const tabsEl    = wrapper.querySelector('[data-product-tabs]');
    const shareEl   = wrapper.querySelector('[data-product-share]');

    this._gallery    = galleryEl  ? new ProductGallery(galleryEl)  : null;
    this._form       = formEl     ? new ProductForm(formEl)         : null;
    this._picker     = pickerEl && variants.length
      ? new VariantPicker(pickerEl, variants, currentVariant, this._gallery, this._form)
      : null;
    this._tabs       = tabsEl     ? new CollapsibleTabs(tabsEl)     : null;
    this._stickyATC  = new StickyATCBar();
    this._share      = shareEl    ? new ProductShare(shareEl)       : null;

    // Handle section re-init in Theme Editor
    document.addEventListener('shopify:section:load', (e) => {
      if (wrapper.closest(`#shopify-section-${e.detail.sectionId}`)) {
        this.destroy();
        new ProductPage();
      }
    });
  }

  destroy() {
    this._stickyATC?.destroy();
  }
}

/* ── Boot ─────────────────────────────────────────────────────────────────── */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ProductPage());
} else {
  new ProductPage();
}
