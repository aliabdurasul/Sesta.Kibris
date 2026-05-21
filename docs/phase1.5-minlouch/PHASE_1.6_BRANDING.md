# Phase 1.6 — Minimum Branding Before Launch
> **Sesta Kıbrıs — "Kıbrıs'ın Sepeti"**  
> File: `PHASE_1.6_BRANDING.md`  
> Dependency: None — start here first

---

## Goal
Establish the minimum brand identity so the app feels intentional and trustworthy before any user touches it. Not a full brand guide — just what stops the app from looking like a prototype.

---

## 1.1 — Logo & Visual Identity

### 1.1.1 — Finalize Logo Asset
- **What**: Confirm the primary logo (SVG preferred, PNG fallback). Must have: full version (icon + wordmark) + icon-only version.
- **Where**: `/public/images/logo.svg`, `/public/images/logo-icon.svg`
- **Done When**: Both files exist, render cleanly on white AND dark backgrounds
- **Notes**: If no designer, use a temporary text-based logo with brand font — ship it, replace later

### 1.1.2 — Favicon Set
- **What**: Generate favicon pack from logo icon
- **Where**: `/public/favicon.ico`, `/public/favicon-16x16.png`, `/public/favicon-32x32.png`, `/public/apple-touch-icon.png`
- **Tool**: https://realfavicongenerator.net
- **Done When**: Browser tab shows Sesta icon, not default browser icon

### 1.1.3 — OG / Social Share Image
- **What**: 1200×630px image with logo + tagline for link previews
- **Where**: `/public/og-image.png`
- **Done When**: Pasting site URL in Telegram/WhatsApp shows branded preview card

---

## 1.2 — Brand Tokens (Colors + Typography)

### 1.2.1 — Define Brand Color Palette
- **What**: Lock in 3 core colors. Example palette for a Cyprus marketplace:

```css
/* /styles/brand.css or tailwind.config.js */
@theme {
  --color-sesta-navy: #0E2B51;
  --color-sesta-orange: #E68228;
  --color-sesta-blue: #288CD2;

  --color-status-pending: #EF4444;
  --color-status-process: #F59E0B;
  --color-status-transit: #3B82F6;
  --color-status-success: #10B981;

  --color-sesta-bg-light: #F8FAFC;
  --color-sesta-bg-dark: #091E3A;
  --color-sesta-surface: #FFFFFF;
}
}
```

- **Where**: Global CSS or Tailwind config
- **Done When**: All CTA buttons use `--color-primary`, no hardcoded random colors exist

### 1.2.2 — Typography
- **What**: Set 1 font family (2 weights max for now)
- **Recommended**: `Inter` (free, clean, works everywhere) or `Plus Jakarta Sans`
- **Where**: `_document.tsx` or `layout.tsx` Google Fonts import + global CSS

```css
body { font-family: 'Inter', sans-serif; }
h1, h2, h3 { font-weight: 700; }
p, span { font-weight: 400; }
```

- **Done When**: No Times New Roman or browser-default serif visible anywhere

### 1.2.3 — Apply Tokens Globally
- **What**: Replace all hardcoded color values in the codebase with CSS variables
- **Done When**: Changing `--color-primary` in one place updates the whole app

---

## 1.3 — App Name & Meta Consistency

### 1.3.1 — HTML Meta Tags
- **What**: Ensure every page has correct title, description, and OG tags
- **Where**: `_app.tsx` or root `layout.tsx`

```tsx
<Head>
  <title>Sesta Kıbrıs — Kıbrıs'ın Sepeti</title>
  <meta name="description" content="Kıbrıs'ın en büyük çevrimiçi pazaryeri. Taze ürünler, yerel marketler, hızlı teslimat." />
  <meta property="og:title" content="Sesta Kıbrıs" />
  <meta property="og:description" content="Kıbrıs'ın Sepeti" />
  <meta property="og:image" content="/og-image.png" />
  <meta property="og:type" content="website" />
</Head>
```

- **Done When**: Sharing the URL anywhere shows correct title and image

### 1.3.2 — App Name Audit
- **What**: Search the entire codebase for placeholder names ("My App", "Next.js App", "localhost", "TODO")
- **Command**: `grep -r "My App\|NextJS\|Placeholder\|TODO_NAME" ./src`
- **Done When**: Zero hits for placeholder app names

### 1.3.3 — Loading / Splash State
- **What**: App loading screen should show logo, not blank white
- **Where**: Root layout or `_app.tsx` loading state
- **Done When**: Hard refresh shows logo for 300ms, then app loads

---

## 1.4 — Brand Voice (Copy Minimums)

### 1.4.1 — Tagline Locked
- **What**: Pick one tagline and use it consistently
- **Suggestion**: *"Kıbrıs'ın Sepeti"* 
  secondary use="market alis verisi artik tek yerde "
- **Where**: Hero section, OG image, email footers, Telegram bot greeting
- **Done When**: Same tagline used in at least 3 places

### 1.4.2 — Empty States Have Brand Copy
- **What**: No "null", "undefined", or "No items found." — replace with friendly copy
- **Examples**:
  - Empty cart: *"Sepetiniz boş — haydi alışverişe!"*
  - No results: *"Bu arama için sonuç bulunamadı. Başka bir şey deneyin."*
  - Loading error: *"Bir şeyler ters gitti. Lütfen tekrar deneyin."*
- **Done When**: 0 raw technical strings visible to end users

---

## 1.5 — Delivery: Branding Checklist

Before moving to next phase, confirm all of these:

```
[ ] 1.1.1 — Logo SVG (full + icon) in /public
[ ] 1.1.2 — Favicon showing in browser tab
[ ] 1.1.3 — OG image renders in Telegram/WhatsApp preview
[ ] 1.2.1 — Brand colors defined as CSS variables
[ ] 1.2.2 — Single font applied globally
[ ] 1.2.3 — No hardcoded hex colors outside variables
[ ] 1.3.1 — Meta tags on all pages
[ ] 1.3.2 — Zero placeholder names in codebase
[ ] 1.3.3 — Branded loading state
[ ] 1.4.1 — Tagline locked and used consistently
[ ] 1.4.2 — All empty states have real copy
```

