# UI SYSTEM

## Design System and UX Principles

---

## 1. DESIGN PHILOSOPHY

SestaKibris must be **simpler than WhatsApp** for its core flows. Every design decision optimizes for:
- Speed of action (tap → result)
- Clarity of status (what's happening now)
- Confidence (trust that the system works)

---

## 2. MOBILE-FIRST PRINCIPLE

SestaKibris is used by people holding a phone while doing something else.

### Rules

- All critical interactions completable one-handed
- Touch targets: minimum 44×44px (primary actions: 56×56px)
- Primary actions at bottom of screen (thumb reach zone)
- Destructive actions require confirmation
- No horizontal scrolling on any screen
- Content readable without zooming

### Desktop Treatment

- Merchant catalog management: responsive desktop layout
- Admin panel: desktop-first (sidebar navigation)
- Customer storefront: responsive (works on both)
- Courier app: mobile-only (no desktop layout needed)

---

## 3. COLOR SYSTEM

### Semantic Colors

| Name | Usage | Notes |
|---|---|---|
| Primary | Main actions, active states | Brand color |
| Success | Delivered, confirmed, positive | Green family |
| Warning | Pending, timeout approaching | Amber family |
| Danger | Rejected, failed, destructive actions | Red family |
| Neutral | Text, borders, backgrounds | Gray scale |

### Status Colors (Order States)

| Status | Color | Meaning |
|---|---|---|
| PENDING | Amber/Yellow | Awaiting action |
| CONFIRMED | Blue | In progress |
| READY | Blue (darker) | Prepared |
| ASSIGNED | Indigo | Courier dispatched |
| IN_TRANSIT | Purple | On the way |
| DELIVERED | Green | Success |
| REJECTED | Red | Failed |
| FAILED_DELIVERY | Red (lighter) | Problem |
| CANCELLED | Gray | Terminated |

---

## 4. TYPOGRAPHY

### Font

- System font stack (no custom font loading in Phase 1)
- `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Turkish character support mandatory (ğ, ü, ş, ö, ç, ı, İ)

### Scale

| Level | Size | Usage |
|---|---|---|
| Display | 24-32px | Page titles |
| Heading | 18-20px | Section headers |
| Body | 16px | Default text (never smaller on mobile) |
| Caption | 14px | Secondary info, timestamps |
| Small | 12px | Badges, labels only |

### Rules

- Never go below 14px for readable content on mobile
- Line height: 1.5 for body text
- Font weight: 400 (body), 500 (emphasis), 600 (headings), 700 (critical)

---

## 5. SPACING AND LAYOUT

### Spacing Scale

Based on 4px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64

### Page Layout

```
┌────────────────────────────┐
│  Header (sticky, 56px)     │
├────────────────────────────┤
│                            │
│  Content (scrollable)      │
│  Padding: 16px horizontal  │
│                            │
│                            │
├────────────────────────────┤
│  Bottom Action (sticky)    │
│  (if primary CTA exists)   │
├────────────────────────────┤
│  Tab Bar (56px)            │
└────────────────────────────┘
```

---

## 6. COMPONENT LIBRARY

### Core Components

| Component | Usage |
|---|---|
| Button | Primary, secondary, destructive, ghost variants |
| Card | Order cards, product cards |
| Badge | Status indicators, count badges |
| Input | Text, number, select, textarea |
| Modal | Confirmation dialogs, forms |
| Toast | Notifications, success/error messages |
| Skeleton | Loading states |
| Empty State | No data placeholders with action |
| Tab Bar | Bottom navigation (mobile) |
| Sidebar | Desktop navigation (admin) |

### Button Rules

| Variant | When to Use |
|---|---|
| Primary (filled) | One per screen, main action |
| Secondary (outlined) | Alternative actions |
| Destructive (red) | Delete, reject, cancel (requires confirmation) |
| Ghost (no border) | Tertiary actions, navigation |

### Button Placement

| Context | Rule |
|---|---|
| Primary action | Full-width, bottom of screen, high contrast |
| Destructive action | Secondary position, requires confirmation |
| Order state actions | Only show valid next-state actions |
| Loading state | Disable + show spinner inside button |

---

## 7. INTERACTION PATTERNS

### Loading States

- Skeleton screens for initial page loads (never blank white screen)
- Button spinners for form submissions
- Inline spinners for partial updates
- Never show a loading state that blocks more than 3 seconds without explanation

### Empty States

Every list/queue must have a designed empty state:
- Illustration or icon (optional)
- Clear message explaining the empty state
- Primary action to resolve it (if possible)
- Always in Turkish

### Error States

- Errors must tell users what to do, not just what went wrong
- Include a retry action when applicable
- Never show raw error codes or English stack traces
- Persistent errors: banner at top of screen
- Transient errors: toast notification

### Confirmations

Required before:
- Rejecting an order
- Cancelling an order
- Deleting an address
- Deactivating a courier
- Changing store to closed

Not required for:
- Accepting an order (speed > safety here)
- Marking order as ready
- Confirming delivery

---

## 8. NAVIGATION PATTERNS

### Customer App

```
Bottom Tab Bar (3 tabs):
  [🏠 Ana Sayfa]  [📦 Siparişlerim]  [👤 Profil]
```

### Merchant Dashboard

```
Bottom Tab Bar (4 tabs):
  [📋 Siparişler]  [🛒 Ürünler]  [🚗 Kuryeler]  [⚙️ Ayarlar]
```

### Courier App

```
Bottom Tab Bar (2 tabs):
  [📦 Teslimatlarım]  [📊 Geçmiş]
```

### Admin Panel (Desktop)

```
Sidebar:
  Dashboard
  Mağazalar
  Siparişler
  Sistem
  Ayarlar
```

### Navigation Rules

- Navigation never changes based on data state
- Active tab is always visually distinct
- Back navigation predictable (always goes to parent)
- Deep links work (every screen has a URL)

---

## 9. RESPONSIVE BREAKPOINTS

| Breakpoint | Name | Target |
|---|---|---|
| < 640px | Mobile | Phones (primary) |
| 640-1024px | Tablet | iPad, large phones |
| > 1024px | Desktop | Laptops, desktops |

### Rules

- Design mobile first, enhance for larger screens
- Customer + Courier: optimized for mobile, usable on desktop
- Merchant: mobile-first for order queue, desktop-friendly for catalog management
- Admin: desktop-first, functional on tablet

---

## 10. ACCESSIBILITY

### Requirements

- All interactive elements keyboard-navigable
- Color is never the only indicator (always pair with text/icon)
- Sufficient contrast ratio (WCAG AA minimum)
- Form inputs have visible labels (not placeholder-only)
- Error messages associated with form fields
- Focus states visible on all interactive elements
- Screen reader labels on icon-only buttons

---

## 11. ANIMATION AND MOTION

### Principles

- Motion is functional, not decorative
- Transitions are fast (150-200ms for micro-interactions)
- Page transitions: none (instant navigation)
- List items entering: subtle fade + slide (200ms)
- Modal: fade overlay + scale content (150ms)

### Rules

- Never block user interaction with animation
- Respect `prefers-reduced-motion`
- No animations longer than 300ms
- No bounce effects or playful animations (professional tool, not a game)

---

## 12. DARK MODE

Not in Phase 1. Revisit in Phase 2.

When implemented: follow system preference, allow manual toggle.
