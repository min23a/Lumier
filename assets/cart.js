/**
 * cart.js — Lumière Beauty Theme
 * Manages all cart interactions: open/close drawer, ATC, quantity updates,
 * item removal, free-shipping bar, subtotal, cart count sync.
 *
 * Pattern:
 *   - CartAPI      — thin wrapper over Shopify's Cart Ajax API
 *   - CartDrawer   — DOM controller for the drawer UI
 *   - CartItems    — manages line-item rendering and quantity edits
 *   - CartShipping — free-shipping progress bar updater
 *
 * No external dependencies. Loaded with `defer` from theme.liquid.
 */

'use strict';

/* ── CartAPI — thin Shopify Cart Ajax wrapper ────────────────────────────── */

class CartAPI {
  static get(signal) {
    return fetch(`${window.routes.cartUrl}.js`, { signal })
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); });
  }

  static add(items, signal) {
    return fetch(window.routes.cartAddUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body:    JSON.stringify({ items }),
      signal
    }).then(r => { if (!r.ok) return r.json().then(d => { throw d; }); return r.json(); });
  }

  static change(key, quantity, signal) {
    return fetch(window.routes.cartChangeUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body:    JSON.stringify({ id: key, quantity }),
      signal
    }).then(r => { if (!r.ok) return r.json().then(d => { throw d; }); return r.json(); });
  }

  static update(updates, signal) {
    return fetch(window.routes.cartUpdateUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body:    JSON.stringify({ updates }),
      signal
    }).then(r => { if (!r.ok) return r.json().then(d => { throw d; }); return r.json(); });
  }
}

/* ── CartShipping — free-shipping progress bar ───────────────────────────── */

class CartShipping {
  constructor(drawerEl) {
    this._bar       = drawerEl?.querySelector('[data-shipping-bar]');
    this._text      = drawerEl?.querySelector('[data-shipping-text]');
    this._fill      = drawerEl?.querySelector('[data-shipping-fill]');
    this._threshold = parseInt(drawerEl?.dataset.freeShippingThreshold || '0', 10);
  }

  update(totalCents) {
    if (!this._bar || !this._threshold) return;

    const remaining = Math.max(0, this._threshold - totalCents);
    const pct       = Math.min(100, Math.round((totalCents / this._threshold) * 100));
    const achieved  = totalCents >= this._threshold;

    if (this._fill) {
      this._fill.style.width = `${pct}%`;
      this._fill.classList.toggle('cart-drawer__progress-fill--complete', achieved);
    }

    if (this._text) {
      if (achieved) {
        this._text.innerHTML  = `✓ ${window.cartStrings?.freeShippingAchieved || 'You qualify for free shipping!'}`;
        this._text.classList.add('cart-drawer__shipping-text--achieved');
      } else {
        const amount = window.Lumiere?.formatMoney?.(remaining) || `$${(remaining / 100).toFixed(2)}`;
        const msg    = (window.cartStrings?.freeShippingThreshold || 'Spend <strong>{{amount}}</strong> more for free shipping')
          .replace('{{amount}}', amount);
        this._text.innerHTML = msg;
        this._text.classList.remove('cart-drawer__shipping-text--achieved');
      }
    }
  }
}

/* ── CartItems — renders and manages line items ──────────────────────────── */

class CartItems {
  constructor(drawerEl) {
    this._wrapper = drawerEl?.querySelector('[data-cart-items-wrapper]');
    this._drawer  = drawerEl;
    this._pending = new Map(); // key → AbortController
  }

  /**
   * Re-render all line items from a cart JSON object.
   * Uses a lightweight template approach — no Liquid re-fetch needed.
   */
  render(cart) {
    if (!this._wrapper) return;
    const itemsEl  = this._wrapper.querySelector('[data-cart-items]');
    const emptyEl  = this._wrapper.querySelector('[data-cart-empty]');

    if (cart.item_count === 0) {
      if (itemsEl)  itemsEl.innerHTML = '';
      if (emptyEl)  emptyEl.removeAttribute('hidden');
      return;
    }

    if (emptyEl) emptyEl.hidden = true;

    const html = cart.items.map((item, i) => this._itemTemplate(item, i + 1)).join('');
    if (itemsEl) {
      itemsEl.innerHTML = html;
    } else {
      this._wrapper.innerHTML = `<div data-cart-items>${html}</div>`;
    }
  }

  /** Client-side line-item template (mirrors cart-item.liquid structure) */
  _itemTemplate(item, index) {
    const imgSrc    = item.image ? this._shopifyImg(item.image, 160) : '';
    const imgSrcset = item.image
      ? `${this._shopifyImg(item.image, 80)} 80w, ${this._shopifyImg(item.image, 160)} 160w`
      : '';

    const variantLine = item.variant_title && item.variant_title !== 'Default Title'
      ? `<p class="cart-item__variant">${this._esc(item.variant_title)}</p>`
      : '';

    const priceLine = item.original_line_price !== item.final_line_price
      ? `<span class="cart-item__price cart-item__price--sale">${this._money(item.final_line_price)}</span>
         <span class="cart-item__compare-price">${this._money(item.original_line_price)}</span>`
      : `<span class="cart-item__price">${this._money(item.final_line_price)}</span>`;

    return `
      <div class="cart-item" data-cart-item data-item-key="${item.key}" data-item-index="${index}">
        <a href="${item.url}" class="cart-item__image-wrap" aria-hidden="true" tabindex="-1">
          ${imgSrc
            ? `<img src="${imgSrc}" srcset="${imgSrcset}" sizes="80px"
                 alt="${this._esc(item.title)}" class="cart-item__image"
                 width="80" height="80" loading="lazy" decoding="async">`
            : '<div class="cart-item__image" style="background:rgba(255,255,255,0.04)"></div>'
          }
        </a>
        <div class="cart-item__info">
          ${item.vendor ? `<p class="cart-item__vendor">${this._esc(item.vendor)}</p>` : ''}
          <p class="cart-item__title">
            <a href="${item.url}">${this._esc(item.product_title)}</a>
          </p>
          ${variantLine}
          <div class="cart-item__controls">
            <div class="cart-item__qty" role="group">
              <button type="button" class="cart-item__qty-btn" data-qty-btn data-direction="minus" data-key="${item.key}">−</button>
              <input type="number" class="cart-item__qty-input" data-qty-input data-key="${item.key}"
                value="${item.quantity}" min="0" max="${item.variant?.inventory_quantity || 99}"
                aria-label="Quantity">
              <button type="button" class="cart-item__qty-btn" data-qty-btn data-direction="plus" data-key="${item.key}">+</button>
            </div>
            <button type="button" class="cart-item__remove" data-remove-item data-key="${item.key}">Remove</button>
          </div>
        </div>
        <div class="cart-item__price-wrap">${priceLine}</div>
      </div>`;
  }

  _shopifyImg(url, width) {
    return url.replace(/(\.[^.]+)$/, `_${width}x$1`);
  }
  _money(cents) {
    return window.Lumiere?.formatMoney?.(cents) || `$${(cents / 100).toFixed(2)}`;
  }
  _esc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /**
   * Handle a quantity change for a specific key.
   * Optimistically updates the input before confirming with the API.
   */
  async changeQuantity(key, newQty) {
    const itemEl = this._wrapper?.querySelector(`[data-item-key="${key}"]`);
    if (itemEl) itemEl.classList.add('cart-item--loading');

    // Cancel any in-flight request for the same key
    this._pending.get(key)?.abort();
    const ctrl = new AbortController();
    this._pending.set(key, ctrl);

    try {
      const cart = await CartAPI.change(key, newQty, ctrl.signal);
      this._pending.delete(key);
      return cart;
    } catch (e) {
      this._pending.delete(key);
      if (itemEl) itemEl.classList.remove('cart-item--loading');
      throw e;
    }
  }
}

/* ── CartDrawer — main drawer UI controller ─────────────────────────────── */

class CartDrawer {
  constructor() {
    this._el       = document.getElementById('CartDrawer');
    if (!this._el) return;

    this._isOpen   = false;
    this._items    = new CartItems(this._el);
    this._shipping = new CartShipping(this._el);
    this._footer   = this._el.querySelector('[data-cart-footer]');
    this._countEls = document.querySelectorAll('[data-cart-count]');
    this._subtotal = this._el.querySelector('[data-cart-subtotal]');
    this._errorEl  = this._el.querySelector('[data-cart-error]');

    this._bindEvents();
    this._syncFromPage();
  }

  /* ── Sync initial state from Shopify SSR ─────────────────────────────── */
  _syncFromPage() {
    // Shipping bar is already server-rendered; nothing needed.
    // Count already in header via Liquid.
  }

  /* ── Open / Close ────────────────────────────────────────────────────── */
  open() {
    if (this._isOpen) return;
    this._isOpen = true;
    this._el.classList.add('is-open');
    this._el.removeAttribute('aria-hidden');
    document.dispatchEvent(new CustomEvent('lumiere:overlay:open'));
    // Trap focus
    this._removeFocusTrap = window.Lumiere?.trapFocus?.(this._el);
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._el.classList.remove('is-open');
    this._el.setAttribute('aria-hidden', 'true');
    document.dispatchEvent(new CustomEvent('lumiere:overlay:close'));
    this._removeFocusTrap?.();
    document.body.style.overflow = '';
  }

  /* ── Event binding (event delegation) ───────────────────────────────── */
  _bindEvents() {
    // Open via cart icon or any data-open-cart trigger
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-cart]'))  this.open();
      if (e.target.closest('[data-cart-close]')) this.close();
    });

    // Close button inside drawer
    this._el.querySelector('[data-cart-close]')?.addEventListener('click', () => this.close());

    // ESC key
    document.addEventListener('lumiere:overlay:close', () => this.close());

    // Checkout button
    this._el.querySelector('[data-cart-checkout]')?.addEventListener('click', () => {
      window.location.href = '/checkout';
    });

    // Quantity buttons + remove (delegated within drawer)
    this._el.addEventListener('click', (e) => {
      const qtyBtn    = e.target.closest('[data-qty-btn]');
      const removeBtn = e.target.closest('[data-remove-item]');

      if (qtyBtn)    this._handleQtyBtn(qtyBtn);
      if (removeBtn) this._handleRemove(removeBtn.dataset.key);
    });

    // Direct qty input change
    this._el.addEventListener('change', (e) => {
      const input = e.target.closest('[data-qty-input]');
      if (!input) return;
      const val = parseInt(input.value, 10);
      if (!isNaN(val)) this._updateQty(input.dataset.key, val);
    });

    // ATC from any form on the page with method="post" action="/cart/add"
    document.addEventListener('submit', (e) => {
      const form = e.target.closest('form[action="/cart/add"]');
      if (!form) return;
      e.preventDefault();
      this._handleATC(form);
    });
  }

  /* ── Add to Cart ─────────────────────────────────────────────────────── */
  async _handleATC(form) {
    const btn = form.querySelector('[type="submit"]');
    if (btn) {
      btn.setAttribute('aria-busy', 'true');
      btn.disabled = true;
    }
    this._clearError();

    const formData = new FormData(form);
    const items = [{
      id:         parseInt(formData.get('id'), 10),
      quantity:   parseInt(formData.get('quantity') || '1', 10),
      properties: this._extractProperties(formData)
    }];

    try {
      await CartAPI.add(items);
      const cart = await CartAPI.get();
      this._updateUI(cart);
      this.open();
    } catch (err) {
      this._showError(err?.description || window.cartStrings?.error || 'Could not add to cart.');
    } finally {
      if (btn) { btn.setAttribute('aria-busy', 'false'); btn.disabled = false; }
    }
  }

  _extractProperties(formData) {
    const props = {};
    for (const [key, val] of formData.entries()) {
      if (key.startsWith('properties[') && key.endsWith(']')) {
        props[key.slice(11, -1)] = val;
      }
    }
    return Object.keys(props).length ? props : undefined;
  }

  /* ── Quantity button click ───────────────────────────────────────────── */
  _handleQtyBtn(btn) {
    const key   = btn.dataset.key;
    const input = this._el.querySelector(`[data-qty-input][data-key="${key}"]`);
    if (!input) return;
    const current = parseInt(input.value, 10) || 0;
    const next    = btn.dataset.direction === 'plus' ? current + 1 : Math.max(0, current - 1);
    input.value   = next;
    this._updateQty(key, next);
  }

  /* ── Update quantity ─────────────────────────────────────────────────── */
  async _updateQty(key, quantity) {
    this._clearError();
    try {
      const cart = await this._items.changeQuantity(key, quantity);
      this._updateUI(cart);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      this._showError(window.cartStrings?.quantityError?.replace('{{quantity}}', err.quantity || '') || 'Could not update quantity.');
      // Re-fetch correct state
      const cart = await CartAPI.get();
      this._updateUI(cart);
    }
  }

  /* ── Remove item ─────────────────────────────────────────────────────── */
  _handleRemove(key) {
    this._updateQty(key, 0);
  }

  /* ── Update the entire drawer UI from a cart JSON object ─────────────── */
  _updateUI(cart) {
    this._items.render(cart);
    this._shipping.update(cart.total_price);
    this._updateCount(cart.item_count);
    this._updateSubtotal(cart.total_price);

    if (this._footer) {
      this._footer.hidden = cart.item_count === 0;
    }

    // Broadcast so other components (header count) can react
    document.dispatchEvent(new CustomEvent('lumiere:cart:updated', {
      bubbles: true,
      detail:  { count: cart.item_count, cart }
    }));
  }

  _updateCount(count) {
    this._countEls.forEach(el => {
      el.textContent = count;
      el.dataset.count = count;
      el.hidden = count === 0;
    });
    // Also update the drawer title count
    const titleCount = this._el.querySelector('[data-cart-count]');
    if (titleCount) {
      titleCount.textContent = count;
      titleCount.hidden = count === 0;
    }
  }

  _updateSubtotal(cents) {
    if (this._subtotal) {
      this._subtotal.textContent = window.Lumiere?.formatMoney?.(cents) || `$${(cents / 100).toFixed(2)}`;
    }
  }

  _showError(msg) {
    if (!this._errorEl) return;
    this._errorEl.textContent = msg;
    this._errorEl.classList.add('is-visible');
    // Auto-clear after 4s
    clearTimeout(this._errorTimer);
    this._errorTimer = setTimeout(() => this._clearError(), 4000);
  }

  _clearError() {
    if (!this._errorEl) return;
    this._errorEl.classList.remove('is-visible');
    this._errorEl.textContent = '';
  }
}

/* ── Boot ────────────────────────────────────────────────────────────────── */

window.Lumiere = window.Lumiere || {};
window.Lumiere.cart = new CartDrawer();
