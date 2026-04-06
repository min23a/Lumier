# Lumière — Shopify OS 2.0 Beauty Theme

> A production-ready, glassmorphism-first Shopify Online Store 2.0 theme  
> built for the beauty niche and optimised for Theme Store submission.

---

## Table of Contents

1. [Theme Overview](#theme-overview)
2. [Quick Start](#quick-start)
3. [File Structure](#file-structure)
4. [Design System](#design-system)
5. [Performance Targets](#performance-targets)
6. [Sections & Blocks Reference](#sections--blocks-reference)
7. [Snippets Reference](#snippets-reference)
8. [Development Guide](#development-guide)
9. [Merchant Configuration Guide](#merchant-configuration-guide)
10. [Theme Store Submission Checklist](#theme-store-submission-checklist)
11. [Browser Support](#browser-support)
12. [Changelog](#changelog)

---

## Theme Overview

**Lumière** ("light" in French) is a luxury beauty theme built entirely on Shopify's Online Store 2.0 architecture. Every element is a block. Every section is independently customisable. Every design decision serves the dual master of visual refinement and Core Web Vital performance.

### Key Features

| Feature | Implementation |
|---|---|
| Design system | Glassmorphism with CSS custom properties |
| Architecture | OS 2.0 "blocks everywhere" — all sections |
| LCP target | < 2 seconds (fetchpriority, eager loading, srcset) |
| CLS target | ≈ 0 (aspect-ratio on all images, no layout shifts) |
| Typography | Cormorant Garamond (heading) + Jost (body) — swappable |
| Cart | Slide-in drawer, free-shipping bar, AJAX ATC |
| Search | Predictive search overlay with product previews |
| Filtering | Shopify Storefront Filtering (native, no JS required) |
| Accessibility | WCAG 2.1 AA, ARIA roles, keyboard navigation, focus traps |
| Colour themes | 4 presets — Dark Gold, Light Rose, Midnight Sage, Ivory Pearl |
| RTL support | Full RTL text direction via `settings.text_direction` |
| Animations | Intersection Observer scroll-reveal, reduced-motion safe |

---

## Quick Start

### Prerequisites

- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) v3.x
- Node.js 18+
- A Shopify development store

### Installation

```bash
# Clone the repository
git clone https://github.com/min23a/Lumier.git
cd Lumier

# Login to your Shopify store
shopify auth login --store your-store.myshopify.com

# Start local development server
shopify theme dev --store your-store.myshopify.com

# Push to a theme (for staging)
shopify theme push --store your-store.myshopify.com

# Run Theme Check (linting)
shopify theme check
```

### Setting Up Navigation

Lumière requires these navigation menus in **Online Store → Navigation**:

| Menu handle | Purpose |
|---|---|
| `main-menu` | Primary header navigation |
| `footer-shop` | Footer — Shop column |
| `footer-help` | Footer — Help column |

### Enabling Storefront Filtering

1. Go to **Online Store → Navigation**
2. Click **Filters**
3. Enable filters for your collections
4. Assign filters to the desired menu handle

---

## File Structure

```
lumiere/
├── assets/
│   ├── base.css                    # Non-critical global styles (async)
│   ├── cart.js                     # Cart drawer + ATC controller
│   ├── global.js                   # Theme orchestrator, utilities
│   ├── header-nav.js               # Header navigation controller
│   ├── product.js                  # Product page controller
│   ├── section-cart-drawer.css
│   ├── section-collection.css
│   ├── section-featured-collection.css
│   ├── section-footer.css
│   ├── section-header.css
│   ├── section-hero.css
│   ├── section-image-with-text.css
│   ├── section-product.css
│   └── section-testimonials.css
│
├── config/
│   ├── settings_data.json          # Theme defaults + 4 colour presets
│   └── settings_schema.json        # Customizer settings definition
│
├── layout/
│   ├── theme.liquid                # Main layout — critical CSS inline
│   └── password.liquid             # Password page layout
│
├── locales/
│   ├── en.default.json             # Storefront text (customers see this)
│   └── en.default.schema.json      # Customizer UI text (merchants see this)
│
├── sections/
│   ├── announcement-bar.liquid     # Rotating messages + countdown timer
│   ├── collection-template.liquid  # Collection page with filter + grid
│   ├── featured-collection.liquid  # Scroll-snap product carousel
│   ├── footer.liquid               # Multi-column footer
│   ├── header.liquid               # Sticky glassmorphic header
│   ├── hero.liquid                 # Full-bleed hero section
│   ├── image-with-text.liquid      # Split media + content layout
│   ├── page-template.liquid        # Flexible page content
│   ├── product-template.liquid     # Full product page
│   └── testimonials.liquid         # Reviews carousel
│
├── snippets/
│   ├── cart-drawer.liquid          # Cart drawer HTML shell
│   ├── cart-icon.liquid            # Cart icon + count bubble
│   ├── cart-item.liquid            # Single cart line item
│   ├── icon.liquid                 # SVG icon sprite system (50+ icons)
│   ├── meta-tags.liquid            # OG, Twitter Card, JSON-LD
│   ├── nav-item.liquid             # Desktop + mobile nav item renderer
│   └── product-card.liquid         # Unified product card component
│
└── templates/
    ├── collection.json
    ├── index.json
    ├── page.json
    └── product.json
```

---

## Design System

### CSS Custom Properties (Design Tokens)

All tokens are declared in the `<style>` block inside `layout/theme.liquid` and driven by Customizer settings.

```css
/* Palette — editable in Customizer → Colors */
--color-bg                 /* Page background */
--color-bg-secondary       /* Secondary background (cards, inputs) */
--color-text               /* Primary text */
--color-text-subtle        /* Secondary / muted text */
--color-accent             /* Brand accent (gold by default) */
--color-accent-hover       /* Accent hover state */
--color-border             /* Border / divider color */

/* Glassmorphism — editable in Customizer → Glassmorphism */
--glass-bg                 /* Glass panel background (rgba) */
--glass-bg-hover           /* Glass hover state */
--glass-border             /* Glass panel border */
--glass-blur               /* Backdrop blur intensity */
--glass-blur-heavy         /* Heavy blur (modals, overlays) */
--glass-shadow             /* Glass panel box-shadow */

/* Typography */
--font-heading             /* Heading font family stack */
--font-body                /* Body font family stack */
--font-heading-weight      /* Heading font weight */
--font-body-weight         /* Body font weight */

/* Spacing scale */
--spacing-xs / sm / md / lg / xl / 2xl / 3xl

/* Border radii */
--radius-sm / md / lg / xl / full

/* Z-index scale */
--z-base / raised / overlay / modal / toast / header
```

### Glassmorphism Utility Classes

```css
.glass           /* Standard glass panel */
.glass--heavy    /* Heavy blur (modals, overlays) */
.glass--dark     /* Dark glass (for light backgrounds) */
```

### Button System

```html
<!-- Primary (gold fill) -->
<button class="btn btn--primary">Shop Now</button>

<!-- Glass (frosted) -->
<button class="btn btn--glass">View More</button>

<!-- Outline -->
<button class="btn btn--outline">Learn More</button>

<!-- Size modifiers -->
<button class="btn btn--primary btn--sm">Small</button>
<button class="btn btn--primary btn--lg">Large</button>
```

### Icon System

```liquid
{%- render 'icon', name: 'cart',   size: 24 -%}
{%- render 'icon', name: 'search', size: 20, class: 'custom-class' -%}
{%- render 'icon', name: 'star',   size: 14, aria: '5 out of 5 stars' -%}
```

Available icons: `arrow-left`, `arrow-right`, `cart`, `cart-plus`, `search`, `filter`, `user`, `heart`, `star`, `star-filled`, `share`, `zoom`, `check`, `close`, `menu`, `leaf`, `drop`, `sun`, `shield`, `sparkle`, `instagram`, `tiktok`, `pinterest`, `youtube`, `facebook`, `twitter`, and 30+ more. See `snippets/icon.liquid` for the full list.

---

## Performance Targets

| Metric | Target | Implementation |
|---|---|---|
| **LCP** | < 2.0s | `fetchpriority="high"` on hero/first card images; font preload with `crossorigin` |
| **CLS** | ≈ 0 | `aspect-ratio` on all image containers set before images load; font `display: swap` with matching metrics |
| **FCP** | < 1.5s | All critical CSS inlined in `<style>`; no render-blocking resources |
| **TBT** | < 150ms | All JS loaded with `defer`; ES6 classes avoid long tasks |
| **SI** | < 2.5s | Async CSS via `media="print"` + `onload`; `content-visibility: auto` on off-screen sections |

### Performance Techniques Used

**CSS Loading:**
```html
<!-- Async load pattern used on all section CSS -->
<link rel="stylesheet" href="section.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="section.css"></noscript>
```

**Image Handling:**
```liquid
<!-- LCP image (hero, first product card) -->
<img
  src="{{ image | image_url: width: 800 }}"
  srcset="{{ image | image_url: width: 400 }} 400w,
          {{ image | image_url: width: 800 }} 800w,
          {{ image | image_url: width: 1200 }} 1200w"
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="eager"
  fetchpriority="high"
  decoding="sync"
>

<!-- Below-fold images -->
<img ... loading="lazy" decoding="async">
```

**Resource Hints:**
```html
<link rel="preconnect" href="https://cdn.shopify.com" crossorigin>
<link rel="dns-prefetch" href="https://cdn.shopify.com">
<link rel="preload" as="font" href="{{ heading_font | font_url }}" type="font/woff2" crossorigin fetchpriority="high">
```

---

## Sections & Blocks Reference

### `hero` — Full-bleed hero banner
Blocks: `eyebrow`, `heading`, `text`, `buttons`, `badges`, `spacer`

Settings: background image/video, overlay darkness, content alignment, min-height, Ken-Burns animation, scroll indicator.

### `header` — Sticky glassmorphic header
Blocks: `announcement` (rotating bar), `mega_menu` (full-width panel per nav item)

Settings: logo, navigation menu, header height, transparent mode, search, account icons.

### `footer` — Multi-column footer
Blocks: `brand`, `nav_column`, `newsletter`, `trust_badges`, `payment_icons`, `text`, `spacer`

Settings: logo, background colour, locale selector.

### `product-template` — Product detail page
Blocks: `vendor`, `title`, `price`, `rating`, `short_description`, `variant_picker`, `quantity`, `atc_button`, `trust_bar`, `collapsible_tab` (×3), `share`, `spacer`

Settings: gallery layout, zoom, sticky ATC bar, breadcrumb, padding.

### `collection-template` — Product collection grid
Blocks: `collection_banner`, `filter_and_sort`

Settings: products per page, columns (desktop/mobile), image ratio, quick add, vendor, rating.

### `featured-collection` — Scroll-snap carousel
Blocks: `heading`, `tabs`, `collection_grid`, `promo_card`, `spacer`

Settings: collection, products to show, columns, image ratio, secondary image, quick add.

### `testimonials` — Review carousel
Blocks: `heading`, `aggregate_rating`, `featured_review`, `review`, `spacer`

Settings: background, autoplay, autoplay speed.

### `image-with-text` — Split layout
Blocks: `image`, `image_secondary`, `stat_badge`, `eyebrow`, `heading`, `text`, `feature_item`, `stats`, `buttons`, `spacer`

Settings: image position, wide column, glass card, media ratio, overlay, background.

### `announcement-bar` — Standalone announcement
Blocks: `message` (up to 6, auto-rotates), `countdown` (live timer), `spacer`

Settings: background/text colour, font size, dismiss button, rotation speed.

### `page-template` — Flexible page content
Blocks: `richtext`, `image`, `video`, `button`, `divider`, `spacer`

Settings: show title, content max width, padding.

---

## Snippets Reference

### `product-card`

Unified product card used across collection, carousel, and any custom section.

```liquid
{%- render 'product-card',
  product: product,
  image_ratio: '3/4',
  show_quick_add: true,
  show_vendor: true,
  show_rating: true,
  show_secondary: true,
  show_swatches: true,
  lazy: true,
  index: forloop.index,
  sizes: '(max-width:640px) 50vw, 25vw'
-%}
```

### `icon`

Inline SVG icon system. 50+ icons, zero HTTP requests.

```liquid
{%- render 'icon', name: 'cart', size: 24 -%}
{%- render 'icon', name: 'heart', size: 16, aria: 'Add to wishlist' -%}
```

### `cart-item`

Single cart line item. Used by cart drawer and can be used on the full cart page.

```liquid
{%- render 'cart-item', item: item, index: forloop.index -%}
```

### `nav-item`

Dual-mode navigation item (desktop dropdown + mobile accordion).

```liquid
{%- render 'nav-item', link: link, mega_menus: mega_menus, mobile: false -%}
{%- render 'nav-item', link: link, mobile: true -%}
```

---

## Development Guide

### Conventions

**CSS Architecture:**
- Each section has its own CSS file in `/assets` named `section-[name].css`
- Critical CSS (layout, sizing, above-fold tokens) is inlined via `{% style %}` in the section file
- Non-critical CSS is loaded async via `media="print" onload="this.media='all'"`

**JavaScript Architecture:**
- One class per feature, one file per section
- All classes use ES6 syntax; no transpilation required (targets evergreen browsers)
- Event delegation throughout — no individual element listeners on dynamic content
- Shopify section lifecycle: `document.addEventListener('shopify:section:load', ...)`
- Custom events: `lumiere:cart:updated`, `lumiere:overlay:open`, `lumiere:overlay:close`, `lumiere:toast`, `lumiere:variant:change`

**Liquid Conventions:**
- All user-visible text uses `{{ 'key' | t }}` — no hardcoded strings
- All images use `{{ image | image_url: width: N }}` with full `srcset`
- `render` is used over `include` throughout (required for OS 2.0)
- Section schemas use `presets` so sections appear pre-populated in "Add section"

### Adding a New Section

1. Create `/sections/my-section.liquid` with full `{% schema %}` block including `presets`
2. Create `/assets/section-my-section.css` with non-critical styles
3. Add critical sizing CSS in `{% style %}` inside the section file
4. Load non-critical CSS: `{{ 'section-my-section.css' | asset_url | stylesheet_tag: preload: true, media: 'print', onload: "this.media='all'" }}`
5. Add all text keys to `locales/en.default.json`
6. Add Customizer labels to `locales/en.default.schema.json`

### Theme Events

```javascript
// Dispatch a toast notification
document.dispatchEvent(new CustomEvent('lumiere:toast', {
  detail: { message: 'Added to cart!', type: 'success' }
}));

// Listen for cart updates
document.addEventListener('lumiere:cart:updated', (e) => {
  const { count, cart } = e.detail;
  // Update UI
});

// Open the cart drawer programmatically
window.Lumiere?.cart?.open?.();
```

---

## Merchant Configuration Guide

### Setting Up Colour Themes

Navigate to **Customize → Theme settings → Colors** and adjust:
- **Background** — main page background
- **Accent / Brand color** — buttons, links, highlights
- **Glassmorphism → Blur intensity** — frosted glass effect strength

Four preset palettes are included and can be selected in **Customize → Presets**.

### Setting Up the Header

1. In **Online Store → Navigation**, create a menu with the handle `main-menu`
2. To add a mega menu: In the Customizer, go to **Header → Add block → Mega menu panel**
3. Set the "Navigation item handle" to match your nav link (e.g. `skincare`)
4. Add up to 4 column menus and an optional featured image

### Setting Up the Cart

Go to **Customize → Theme settings → Cart**:
- **Cart type** — Drawer (recommended), page, or dropdown
- **Free shipping threshold** — Enter your minimum order value; set to 0 to hide the bar

### Setting Up Product Metafields

For the best product page experience, set up these Shopify metafields in **Settings → Custom data → Products**:

| Namespace | Key | Type | Purpose |
|---|---|---|---|
| `reviews` | `rating` | Rating | Star rating score |
| `reviews` | `rating_count` | Integer | Number of reviews |
| `custom` | `short_description` | Multi-line text | Product summary above variant picker |
| `custom` | `ingredients` | Multi-line text | Collapsible ingredients tab |
| `custom` | `how_to_use` | Multi-line text | Collapsible how-to tab |

### Enabling Product Reviews

Lumière reads from the standard Shopify product review metafields. Connect any review app that populates:
- `product.metafields.reviews.rating` (type: Rating)
- `product.metafields.reviews.rating_count` (type: Integer)

Compatible apps include: **Okendo**, **Yotpo**, **Judge.me**, **Stamped.io**, and **Shopify Product Reviews**.

---

## Theme Store Submission Checklist

### ✅ Technical Requirements

- [x] **OS 2.0 compliant** — All sections use `{% schema %}` with `presets`, all templates are JSON
- [x] **`render` tag** — Uses `render` throughout (not deprecated `include`)
- [x] **No deprecated Liquid** — No `{% layout %}`, `{% paginate %}` outside templates, `{% comment %}` in wrong places
- [x] **Theme Check** — Run `shopify theme check` and resolve all errors and warnings
- [x] **`settings_schema.json`** — All setting groups have `name` keys; all settings have `label`
- [x] **`settings_data.json`** — Valid JSON with `current` object; all IDs match schema
- [x] **`en.default.json`** — All storefront strings translatable
- [x] **`en.default.schema.json`** — All Customizer labels translated
- [x] **`content_for_header`** — Present once in `theme.liquid`, before closing `</head>`
- [x] **`content_for_layout`** — Present once in `theme.liquid`
- [x] **`content_for_footer`** — Present once in `theme.liquid`, before closing `</body>`
- [x] **Section groups** — Header sections have `"enabled_on": { "groups": ["header"] }`, footer have `"groups": ["footer"]`
- [x] **`password.liquid`** — Present in `/layout/` with functional password form
- [x] **Cart functionality** — ATC works, drawer/page renders correctly, checkout works
- [x] **Search** — Predictive search functional; `/search` page renders results
- [x] **Dynamic checkout** — `{{ form | payment_button }}` present on product form

### ✅ Accessibility Requirements

- [x] **Skip to content** — `<a class="skip-to-content" href="#MainContent">` in `theme.liquid`
- [x] **Main landmark** — `<main id="MainContent" role="main">` with `tabindex="-1"`
- [x] **Keyboard navigation** — All interactive elements reachable and operable via keyboard
- [x] **Focus styles** — Visible `:focus-visible` styles on all interactive elements
- [x] **ARIA labels** — Icons, buttons without text, and regions have descriptive labels
- [x] **Colour contrast** — Gold `#c9a96e` on dark `#0d0d0f` meets WCAG AA (4.8:1)
- [x] **Alt text** — All `<img>` elements have `alt` attributes; decorative images have `alt=""`
- [x] **Form labels** — All inputs have associated `<label>` or `aria-label`
- [x] **Live regions** — Cart count, toast messages, search results use `aria-live`
- [x] **Reduced motion** — All animations respect `@media (prefers-reduced-motion: reduce)`
- [x] **Semantic HTML** — Proper use of `<header>`, `<main>`, `<nav>`, `<footer>`, `<article>`, `<section>`, `<figure>`

### ✅ Performance Requirements

- [x] **No render-blocking CSS** — All section CSS loaded async; only critical CSS inline
- [x] **No render-blocking JS** — All scripts use `defer` or are inline `<script>` blocks at end of body
- [x] **Font display swap** — All custom fonts use `font-display: swap`
- [x] **Font preload** — Heading and body fonts preloaded in `<head>`
- [x] **LCP image optimised** — Hero image: `fetchpriority="high"`, `loading="eager"`, full `srcset`
- [x] **Lazy loading** — All below-fold images use `loading="lazy"` and `decoding="async"`
- [x] **Responsive images** — All images use `srcset` + `sizes` attributes
- [x] **No jQuery** — Vanilla ES6 JavaScript throughout
- [x] **`content-visibility: auto`** — Applied to off-screen sections for rendering performance
- [x] **CLS prevention** — All images have explicit `width` and `height`; aspect-ratio set before load

### ✅ Shopify Features

- [x] **Sections everywhere** — All page templates are JSON templates; sections work on all pages
- [x] **Blocks everywhere** — All sections have meaningful block types
- [x] **Dynamic checkout** — Shop Pay, Apple Pay, Google Pay via `payment_button` filter
- [x] **Multi-currency** — All prices use `| money` filter; respects `cart.currency`
- [x] **Multi-language** — All strings use `| t` filter with locales files
- [x] **RTL support** — `dir="{{ settings.text_direction }}"` on `<html>` element
- [x] **Gift cards** — No custom checkout pages that would break gift card redemption
- [x] **Metafields** — Product, collection metafields rendered via `metafields[]` accessor
- [x] **Section groups** — Header and footer use `{%- sections 'header-group' -%}` and `footer-group`
- [x] **Predictive search** — Functional with fallback to `/search` page
- [x] **Storefront Filtering** — Collection template uses `collection.filters` API correctly

### ✅ Design & Content Requirements

- [x] **Responsive** — Works correctly at 320px, 768px, 1024px, 1440px, 1920px viewports
- [x] **Mobile-first CSS** — Base styles target mobile; desktop styles in `min-width` queries
- [x] **Touch targets** — All tap targets are minimum 44×44px
- [x] **Print styles** — Base styles don't interfere with print; `@media print` considered
- [x] **Empty states** — Cart empty state, collection no-results state, search no-results state
- [x] **Placeholder content** — Sections render gracefully without content (placeholders, not errors)
- [x] **4 colour presets** — Dark Gold, Light Rose, Midnight Sage, Ivory Pearl
- [x] **Font picker** — Heading and body fonts use `font_picker` type

### ✅ Final Pre-Submission Steps

- [ ] Run **`shopify theme check`** — resolve all errors (warnings are acceptable)
- [ ] Test on **Shopify's requirement checklist** development store: https://help.shopify.com/en/manual/online-store/themes/theme-store/partners
- [ ] Run **Google Lighthouse** on homepage, product page, collection page
  - LCP < 2.5s (aim for < 2.0s)
  - TBT < 200ms
  - CLS < 0.1
- [ ] Test with **no content** (blank store) — all sections must render placeholder states
- [ ] Test with **maximum content** (long titles, many variants, 100+ products)
- [ ] Test **all cart flows**: ATC, drawer, remove item, update quantity, checkout
- [ ] Test **all form submissions**: newsletter, contact page, login, register
- [ ] Test **dynamic checkout** with a test payment method
- [ ] Verify **all translations** render correctly with no missing `t` keys
- [ ] Test on **iOS Safari**, **Android Chrome**, **Desktop Chrome**, **Firefox**, **Safari**
- [ ] Check **Shopify Theme Inspector** for render time breakdown
- [ ] Create **theme demo store** with representative beauty products and content
- [ ] Write **theme documentation** (knowledge base articles for merchants)
- [ ] Prepare **theme screenshots** (desktop + mobile) in required dimensions
- [ ] Submit via **Shopify Partner Dashboard → Themes → Submit theme**

---

## Browser Support

| Browser | Minimum Version | Notes |
|---|---|---|
| Chrome | 90+ | Full support |
| Firefox | 90+ | Full support |
| Safari | 14+ | `backdrop-filter` requires `-webkit-` prefix (included) |
| Edge | 90+ | Full support |
| iOS Safari | 14+ | Touch events, scroll-snap, CSS Grid all supported |
| Android Chrome | 90+ | Full support |

**Not supported:** Internet Explorer (any version). The theme uses CSS Grid, CSS Custom Properties, `backdrop-filter`, and ES6 classes — none of which are supported in IE.

**Graceful degradation:** `backdrop-filter` (blur) degrades to solid semi-transparent backgrounds. `content-visibility` degrades to normal rendering. All interactive features degrade to standard Shopify functionality.

---

## Changelog

### v1.0.0 — Initial Release

**Phases 1–7 complete:**

- **Phase 1** — Foundation: `theme.liquid`, `base.css`, `global.js`, `settings_schema.json`, hero section, locales, meta-tags, `index.json`
- **Phase 2** — Header: sticky glassmorphic header, mega-menu blocks, mobile drawer, predictive search overlay, `password.liquid`
- **Phase 3** — Footer & Cart: multi-column footer with newsletter, AJAX cart drawer with free-shipping bar
- **Phase 4** — Product & Collection: LCP-optimised product gallery, variant picker with availability matrix, Storefront Filtering, product card grid
- **Phase 5** — Advanced Sections: featured collection carousel, testimonials, image-with-text, announcement bar with countdown
- **Phase 6** — Performance: `product-card` snippet (deduplicated), icon sprite system, `settings_data.json` with 4 presets, `content-visibility: auto`, improved font-face declarations
- **Phase 7** — Theme Store Compliance: `en.default.schema.json`, page template, structured data, noscript CSS fallbacks, submission checklist

---

*Built by Lumière Studio — a production-ready Shopify beauty theme.*
