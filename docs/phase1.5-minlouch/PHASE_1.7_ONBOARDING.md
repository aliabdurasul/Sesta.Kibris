# Phase 1.7 — Onboarding + Market Discovery
> **Sesta Kıbrıs**  
> File: `PHASE_1.7_ONBOARDING.md`  
> Dependency: Phase 1 complete (brand tokens must exist)

---

## Goal
Every new user's first 60 seconds must feel effortless. They should immediately see value — the best markets, trending products, or promoted spots — without friction. This phase covers: first-launch flow, guest browsing, top markets logic, and ad/promoted placement.

---
--- {not in this phase skip it now implement phase2.0

## 2.1 — First Launch Detection

### 2.1.1 — Detect New vs Returning User
- **What**: On app load, check if user has visited before
- **Where**: `hooks/useFirstLaunch.ts`

```ts
// hooks/useFirstLaunch.ts
import { useEffect, useState } from 'react'

export function useFirstLaunch(): boolean {
  const [isFirst, setIsFirst] = useState(false)

  useEffect(() => {
    const visited = localStorage.getItem('sesta_visited')
    if (!visited) {
      setIsFirst(true)
      localStorage.setItem('sesta_visited', '1')
    }
  }, [])

  return isFirst
}
```

- **Done When**: First visit → onboarding shown. Second visit → skips directly to home.

### 2.1.2 — Onboarding Gate in Root Layout
- **What**: Wrap app root with onboarding check
- **Where**: `app/layout.tsx` or `pages/_app.tsx`

```tsx
const isFirst = useFirstLaunch()
if (isFirst) return <OnboardingScreen />
return <>{children}</>
```

- **Done When**: Onboarding only triggers once per device

--- 
## 2.2 — Onboarding Screens (3-Slide Flow)

### 2.2.1 — Slide 1: Welcome & Brand
- **What**: Full-screen welcome with logo, tagline, warm background
- **Content**:
  - Logo centered
  - H1: *"Kıbrıs'ın Sepeti'ne Hoş Geldiniz"*
  - Subtext: *"Yerel marketler, taze ürünler, hızlı teslimat."*
  - CTA button: *"Başlayalım →"*
- **Done When**: Renders correctly on mobile (375px) and desktop

### 2.2.2 — Slide 2: How It Works (3 Icons)
- **What**: Simple 3-step explainer
- **Content**:
  - 🛍️ *"Market Seç"* — Yakınındaki en iyi marketleri keşfet
  - 🧺 *"Ürün Ekle"* — Sepetine istediğini ekle
  - 🚀 *"Hızlı Teslimat"* — Kapına kadar getiriyoruz
- **Done When**: Icons + copy visible, no layout overflow

### 2.2.3 — Slide 3: Location / CTA
- **What**: Ask for location OR let them browse without it
- **Content**:
  - *"Sana en yakın marketleri gösterelim"*
  - Primary CTA: *"Konumumu Paylaş"* (triggers browser location prompt)
  - Secondary: *"Şimdilik Atla"* (proceeds as guest, Lefkoşa as default)
- **Done When**: Both paths work — location granted → uses coords; skipped → default city used

### 2.2.4 — Onboarding Skip Button
- **What**: Always show a small "Atla" (Skip) link from slide 1
- **Where**: Top-right corner, ghost button style
- **Done When**: Skip from any slide → jumps to home without completing onboarding

### 2.2.5 — Onboarding Progress Indicator
- **What**: Dot indicators at bottom (3 dots, active dot filled)
- **Done When**: Dots update as slides change, tapping dots navigates between slides
}
---

## 2.3 — Guest Browsing (No Forced Login)

### 2.3.1 — Allow Full Browse Without Account
- **What**: Users can browse all markets and products as guests
- **Where**: Middleware / route guards
- **Rule**: Only block on: checkout, wishlists, order history
- **Done When**: `/` `/markets` `/market/[id]` `/product/[id]` all load without auth

### 2.3.2 — Soft Login Prompts
- **What**: When guest tries to add to cart → show modal: *"Devam etmek için giriş yapın"*
- **Options**: Login / Register / Continue as Guest (if guest cart supported)
- **Done When**: Modal appears, doesn't hard-redirect, user can dismiss it

---
home feed

### 2.4.2 — "Promoted" / Sponsored Market Slot
- **What**: DB field `markets.is_promoted: boolean` + `promoted_until: Date`
- **Where**: `schema.prisma` or migration file
- **UI**: Promoted markets show a subtle *"Öne Çıkan"* badge (gold, small)
- **Done When**: Admin can toggle promotion, badge shows in feed, promoted markets appear first

### 2.4.3 — "Open Now" Filter
- **What**: Markets have `opening_hours` JSON field. Filter toggle on home screen.
- **Format**:
```json
{
  "mon": { "open": "08:00", "close": "22:00" },
  "tue": { "open": "08:00", "close": "22:00" },
  ...
}
```
- **Done When**: "Açık" toggle filters to only currently-open markets using server time (UTC+2 for Cyprus)

### 2.4.4 — Home Feed Sections
- **What**: Structure home feed into named sections:

```
[🔥 Öne Çıkan Marketler]   ← promoted slots (max 3)
[⭐ En Popüler]             ← top rated, high volume
[📍 Yakınında]             ← location-based (if location granted)
[🛒 Tüm Marketler]         ← full paginated list
```

- **Done When**: Each section renders with real data, empty sections are hidden

### 2.4.5 — Market Card Component
- **What**: Reusable `<MarketCard />` component
- **Props**: `name, logo, coverImage, rating, deliveryTime, minOrder, isPromoted, isOpen`
- **Done When**: Card looks complete with all states: open/closed, promoted/normal, loading skeleton

---

## 2.5 — Home Screen Ad Banner (Optional Promoted Slot)

### 2.5.1 — Banner Data Model
- **What**: Simple ad banner table
```sql
CREATE TABLE banners (
  id UUID PRIMARY KEY,
  image_url TEXT NOT NULL,
  link_url TEXT,           -- deep link to market or product
  is_active BOOLEAN DEFAULT true,
  display_order INT,
  starts_at TIMESTAMP,
  ends_at TIMESTAMP
);
```
- **Done When**: Admin can insert a banner row and it appears on home

### 2.5.2 — Carousel Component
- **What**: Auto-scrolling banner carousel at top of home screen
- **Behavior**: 4s auto-advance, dots indicator, swipeable on mobile
- **Max banners**: 5 active at a time
- **Done When**: Carousel shows live banners, auto-scrolls, pauses on hover/touch

### 2.5.3 — Banner Analytics (Minimal)
- **What**: Track impressions and clicks per banner
- **Where**: `POST /api/banners/[id]/click`
- **Done When**: Click count increments in DB when banner is tapped

---

## 2.6 — Delivery: Onboarding Checklist

```
[ ] 2.1.1 — First launch detection with localStorage
[ ] 2.1.2 — Onboarding gate in root layout
[ ] 2.2.1 — Slide 1: Welcome screen
[ ] 2.2.2 — Slide 2: How it works
[ ] 2.2.3 — Slide 3: Location prompt with skip
[ ] 2.2.4 — Skip button from any slide
[ ] 2.2.5 — Dot progress indicator
[ ] 2.3.1 — Guest browsing on all non-transactional routes
[ ] 2.3.2 — Soft login modal on cart action
[ ] 2.4.1 — Markets ranking algorithm in backend
[ ] 2.4.2 — Promoted market slot + badge
[ ] 2.4.3 — Open Now filter with Cyprus timezone
[ ] 2.4.4 — Home feed sections (Öne Çıkan / Popüler / Yeni / Yakın)
[ ] 2.4.5 — MarketCard component with all states
[ ] 2.5.1 — Banners table in DB
[ ] 2.5.2 — Auto-scrolling banner carousel
[ ] 2.5.3 — Banner click tracking
```

