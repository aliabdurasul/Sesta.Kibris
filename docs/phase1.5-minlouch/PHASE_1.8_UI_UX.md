# Phase 1.8 — UI/UX Minimum (Olmazsa Olmaz)
> **Sesta Kıbrıs**  
> File: `PHASE_1.8_UI_UX.md`  
> Dependency: Phase 1 (brand tokens), Phase 2 (core screens exist)

---

## Goal
Not a redesign. Fix the things that make users distrust or abandon the app. Every task here is a conversion killer if missing. Fast wins, high impact.

---

## 3.1 — Navigation (The Spine)

### 3.1.1 — Bottom Navigation Bar (Mobile)
- **What**: Persistent bottom nav with 4-5 tabs
- **Tabs**: 🏠 Ana Sayfa | 🔍 Keşfet | 🧺 Sepet | 👤 Hesabım
- **Where**: `components/BottomNav.tsx`
- **Rules**:
  - Active tab has primary color icon + label
  - Cart tab shows badge with item count (e.g. `3`)
  - Fixed, never scrolls away
- **Done When**: All tabs navigate correctly, badge updates on cart change

### 3.1.2 — Top Header Bar
- **What**: Consistent header on all non-onboarding screens
- **Left**: Logo (small) or Back arrow (inner pages)
- **Center**: Page title or Search bar (home)
- **Right**: Cart icon with count + (if logged in) profile avatar
- **Done When**: Header looks identical on home, market, product pages

### 3.1.3 — Active Route Highlight
- **What**: Current page's nav item is visually distinct
- **Done When**: No ambiguity about which screen user is on

---

## 3.2 — Search

### 3.2.1 — Global Search Bar
- **What**: Prominent search input on home screen + search icon in header
- **Where**: `components/SearchBar.tsx`
- **Placeholder**: *"Market veya ürün ara..."*
- **Done When**: Tapping search focuses input, shows keyboard on mobile

### 3.2.2 — Search Results Page
- **What**: `/search?q=` page showing markets AND products
- **Sections**:
  - *"Marketler"* (market results)
  - *"Ürünler"* (product results)
- **Empty state**: *"'{query}' için sonuç bulunamadı"* + suggested categories
- **Done When**: Typing and submitting returns real results from DB

### 3.2.3 — Recent Searches
- **What**: Below empty search bar, show last 5 searches (localStorage)
- **Done When**: Previous searches appear as chips, tapping re-runs search

---

## 3.3 — Product & Market Detail Pages

### 3.3.1 — Market Detail Page Must-Haves
- **What**: `/market/[id]` must show:
  - Cover image (full width)
  - Logo + name + rating + delivery info
  - Open/Closed badge
  - Category tabs (if market has product categories)
  - Product grid
  - Sticky "Sepete Ekle" area at bottom
- **Done When**: All elements present, no layout breaks on mobile

### 3.3.2 — Product Detail Sheet/Page Must-Haves
- **What**: `/product/[id]` or bottom sheet must show:
  - Product image (zoomable)
  - Name, price (bold, large)
  - Description
  - Quantity selector (− qty +)
  - "Sepete Ekle" CTA (sticky, full-width on mobile)
  - Related products (horizontal scroll)
- **Done When**: User can add item and quantity is controlled correctly

### 3.3.3 — Price Display Consistency
- **What**: Standardize all price displays across the app

```ts
// utils/formatPrice.ts
export const formatPrice = (amount: number, currency = 'EUR') =>
  new Intl.NumberFormat('tr-CY', { style: 'currency', currency }).format(amount)
// Output: "€12,50"
```

- **Done When**: No raw numbers like `12.5` or `12.500` — always `€12,50` format in turkish lira

---

## 3.4 — Cart & Checkout Flow

### 3.4.1 — Cart Page
- **What**: `/cart` page with:
  - List of items (image, name, qty, price)
  - Quantity editors inline
  - Remove item button
  - Subtotal / delivery fee / total breakdown
  - "Ödemeye Geç" CTA
- **Done When**: All cart operations work, total recalculates live

### 3.4.2 — Cart Persistence
- **What**: Cart survives page refresh (localStorage or server-side for logged-in users)
- **Done When**: Adding to cart, refreshing page → items still there

### 3.4.3 — Checkout Steps (Linear Flow)
- **What**: 3-step checkout:
  1. **Teslimat Adresi** — address form or saved address picker
  2. **Ödeme** — Stripe card input (Phase 5)
  3. **Onay** — order summary before confirm
- **Done When**: Steps are visually clear, user can't skip step 2 without completing step 1

### 3.4.4 — Order Confirmation Page
- **What**: `/order/[id]/success` page
- **Content**: ✅ icon + *"Siparişiniz Alındı!"* + order number + estimated time
- **Done When**: Appears after successful payment, doesn't show on direct URL access

---

## 3.5 — Loading & Error States

### 3.5.1 — Skeleton Loaders (Not Spinners)
- **What**: Replace all `<Spinner />` or blank screens with skeleton UI
- **Where**: MarketCard, ProductCard, home feed sections
- **Done When**: No blank flash before content loads

### 3.5.2 — Error Boundary
- **What**: Global error boundary catches unhandled JS errors
- **Shows**: Friendly error page, not white screen of death
- **Where**: `app/error.tsx` or `ErrorBoundary` component
- **Done When**: Deliberately throwing an error shows branded error page

### 3.5.3 — Network Error Toast
- **What**: When any API call fails → show toast notification
- **Message**: *"Bağlantı hatası. Lütfen tekrar deneyin."*
- **Where**: Global axios/fetch interceptor
- **Done When**: Turning off network → failed call → toast appears automatically

### 3.5.4 — 404 Page
- **What**: Custom 404 with logo + friendly message + "Ana Sayfaya Dön" button
- **Where**: `app/not-found.tsx` or `pages/404.tsx`
- **Done When**: Going to `/gibberish` shows branded 404, not Next.js default

---

## 3.6 — Mobile Responsiveness (Non-Negotiable)

### 3.6.1 — Test Breakpoints
- **What**: Every page must pass visual check at these widths:
  - 375px (iPhone SE — smallest common)
  - 390px (iPhone 14)
  - 768px (tablet)
  - 1280px (desktop)
- **Done When**: No horizontal scroll, no clipped text, no overlapping elements at any size

### 3.6.2 — Touch Targets
- **What**: All buttons/links minimum 44×44px tap area (Apple HIG standard)
- **Done When**: No buttons that require precision tapping to hit

### 3.6.3 — Image Optimization
- **What**: All images use `next/image` with proper `width`, `height`, `priority` props
- **Done When**: Lighthouse performance score ≥ 70 on mobile

---

## 3.7 — Micro-Interactions (Fast Wins)

### 3.7.1 — Add to Cart Animation
- **What**: When item added to cart → brief scale bounce on cart icon badge
- **Done When**: Visual feedback on every cart add, even if just CSS transition

### 3.7.2 — Button Loading States
- **What**: Every form submit button shows a spinner and disables during API call
- **Done When**: No double-submission possible on any form

### 3.7.3 — Toast Notification System
- **What**: Global toast provider (top-right, 3s auto-dismiss)
- **Types**: success (green), error (red), info (blue)
- **Where**: `components/Toast.tsx` + `context/ToastContext.tsx`
- **Done When**: `useToast().success("Ürün sepete eklendi!")` works from any component

---

## 3.8 — Accessibility Minimums

### 3.8.1 — Color Contrast
- **What**: All text passes WCAG AA (4.5:1 ratio for body text)
- **Tool**: https://webaim.org/resources/contrastchecker/
- **Done When**: Primary text on white and white text on primary color both pass

### 3.8.2 — Alt Text on Images
- **What**: All `<img>` and `<Image>` tags have meaningful `alt` attributes
- **Done When**: `grep -r 'alt=""' ./src` returns 0 hits (or only decorative images with empty alt)

---

## 3.9 — Delivery: UI/UX Checklist

```
[ ] 3.1.1 — Bottom nav (mobile, 4 tabs, cart badge)
[ ] 3.1.2 — Top header bar consistent
[ ] 3.1.3 — Active route highlight
[ ] 3.2.1 — Global search bar
[ ] 3.2.2 — Search results page (markets + products)
[ ] 3.2.3 — Recent searches (localStorage)
[ ] 3.3.1 — Market detail page complete
[ ] 3.3.2 — Product detail with qty selector + CTA
[ ] 3.3.3 — Price formatting utility applied everywhere
[ ] 3.4.1 — Cart page with full breakdown
[ ] 3.4.2 — Cart persistence
[ ] 3.4.3 — 3-step checkout flow
[ ] 3.4.4 — Order confirmation page
[ ] 3.5.1 — Skeleton loaders on all feed components
[ ] 3.5.2 — Global error boundary
[ ] 3.5.3 — Network error toast
[ ] 3.5.4 — Custom 404 page
[ ] 3.6.1 — Tested at 375/390/768/1280px
[ ] 3.6.2 — All touch targets ≥ 44px
[ ] 3.6.3 — next/image on all images
[ ] 3.7.1 — Cart icon bounce animation
[ ] 3.7.2 — Button loading states
[ ] 3.7.3 — Toast system working
[ ] 3.8.1 — Color contrast passes WCAG AA
[ ] 3.8.2 — Alt text on all images
```

