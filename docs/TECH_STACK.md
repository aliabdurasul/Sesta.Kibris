# TECH STACK

## Technology Choices and Rationale

---

## 1. STACK OVERVIEW

| Layer | Technology | Version Target |
|---|---|---|
| Frontend | Next.js (App Router) | Latest stable (15.x) |
| UI Framework | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Backend | Supabase | Cloud (managed) |
| Database | PostgreSQL | 15+ (via Supabase) |
| Auth | Supabase Auth | Built-in |
| Realtime | Supabase Realtime | Built-in |
| Storage | Supabase Storage | Built-in |
| Serverless Logic | Supabase Edge Functions | Deno runtime |
| Deployment | Vercel | Pro plan |
| Payments (Phase 4) | Stripe Connect | Latest API |
| Language | TypeScript | 5.x (strict mode) |
| Package Manager | pnpm | Latest stable |

---

## 2. FRONTEND: NEXT.JS (App Router)

### Why Next.js

- Production-grade React framework with file-based routing
- Routes map cleanly to role-based URL namespaces (`/merchant/orders`, `/customer/track`)
- Server-side rendering for customer-facing catalog pages (SEO + performance)
- API routes for webhooks and third-party integrations without a separate backend
- Excellent Supabase SSR integration via `@supabase/ssr`
- Vercel deployment provides zero-config CI/CD, preview deploys per PR, edge CDN

### Why NOT create-react-app or Vite SPA

- No SSR capability — poor SEO for public catalog pages
- More complex production deployment setup
- No built-in API routes

### Why NOT Remix or SvelteKit

- Next.js has the largest ecosystem and Supabase-specific tooling
- Team familiarity and hiring pool
- Vercel-native deployment reduces friction

### Key Libraries

| Library | Purpose |
|---|---|
| `@supabase/ssr` | Server-side Supabase client for Next.js |
| `@supabase/supabase-js` | Client-side Supabase operations |
| `tailwindcss` | Utility-first CSS framework |
| `zustand` or `jotai` | Lightweight client state (cart, UI state only) |
| `react-hook-form` + `zod` | Form handling + schema validation |
| `next-intl` | Internationalization (Turkish primary) |
| `sonner` | Toast notifications |

---

## 3. BACKEND: SUPABASE

### Why Supabase

- PostgreSQL at the core — battle-tested relational database
- Row Level Security (RLS) built into Postgres — authorization lives in the database
- Built-in Auth with JWT supports multiple roles without external IdP
- Realtime is first-class — Postgres changes broadcast with sub-second latency
- Edge Functions for business logic
- Storage for product images
- Single platform eliminates managing separate services

### Why NOT Firebase

- NoSQL document model is hostile to relational commerce data
- Realtime data consistency guarantees are weaker
- Security Rules harder to audit than Postgres RLS
- Deeper vendor lock-in

### Why NOT a custom Express/Node backend

- Massive infrastructure overhead for Phase 1
- Auth, realtime, storage, database each need separate implementation and hosting
- Speed of execution is critical — Supabase provides 80% out of the box

### Why NOT Prisma or Drizzle ORM

- Supabase client provides type-safe queries via generated types
- RLS policies are the security layer — ORMs bypass them by default
- Direct Supabase client usage aligns with the platform's security model
- Edge Functions use Supabase client directly

---

## 4. STYLING: TAILWIND CSS

### Why Tailwind

- Utility-first approach matches component-driven architecture
- No CSS-in-JS runtime cost
- Consistent design tokens via configuration
- Responsive design primitives built-in
- Mobile-first by default (matches our PWA-first approach)

### Why NOT Material UI or Chakra

- Heavy bundle size for a PWA that must load fast
- Opinionated components don't match our custom design needs
- Harder to achieve the "WhatsApp-level simplicity" requirement

---

## 5. AUTH: SUPABASE AUTH

### Role Model

| Role | Assignment | RLS Scope |
|---|---|---|
| `customer` | Default for all sign-ups | Own orders, own addresses |
| `merchant` | Assigned by admin during onboarding | Own merchant data, own orders |
| `courier` | Created by merchant | Orders assigned to them |
| `admin` | Manually assigned in database | Service role in Edge Functions |

### Session Strategy

- JWTs contain role claim, used by RLS policies
- Merchant and courier sessions are separate — no elevation possible
- Password-based auth in Phase 1
- OTP/magic link in Phase 2
- Token refresh handled by `@supabase/ssr` middleware

---

## 6. REALTIME: SUPABASE REALTIME

### Strategy

Realtime is a **feature**, not a default.

| Screen | Strategy |
|---|---|
| Merchant order queue | Subscription on `orders` where `merchant_id` matches |
| Customer order tracking | Subscription on specific `order_id` |
| Courier delivery queue | Subscription on `orders` where `courier_id` matches |
| Admin dashboard | Subscription on platform-wide order aggregates |
| Product catalog | Server-rendered + cached; NO realtime |
| Order history | Standard query; NO realtime |

Every subscription must have a defined unsubscribe lifecycle.

---

## 7. DEPLOYMENT: VERCEL

### Why Vercel

- Native Next.js platform (same company)
- Zero-config deployment from git push
- Preview deployments per PR for QA
- Edge CDN for static assets and SSR
- Environment variable management
- Analytics and performance monitoring built-in

### Deployment Flow

```
git push → Vercel build → Preview deploy (PR) or Production deploy (main)
```

---

## 8. MOBILE: PWA

### Why PWA Instead of Native App

- No app store approval dependency
- Single codebase for all actors
- Installable on home screen (Android + iOS)
- Push notifications via Web Push API
- Faster iteration (deploy = live for all users)
- Lower development cost

### When to Reconsider Native

- If push notification reliability on iOS becomes a blocker
- If GPS background tracking is required (Phase 3+)
- If app store presence becomes a competitive requirement

---

## 9. PAYMENTS (PHASE 4): STRIPE CONNECT

### Why Stripe Connect

- Express accounts minimize merchant onboarding friction
- Automated payouts on delivery confirmation
- Commission deduction built into platform transfers
- Handles compliance, KYC, and reporting
- Excellent developer experience and documentation

### Connected Account Type

Stripe Express — merchants don't manage Stripe directly; SestaKibris handles the payment UX.

---

## 10. DEVELOPMENT TOOLS

| Tool | Purpose |
|---|---|
| TypeScript (strict) | Type safety across frontend and backend |
| ESLint | Code quality and consistency |
| Prettier | Code formatting |
| pnpm | Fast, disk-efficient package management |
| Supabase CLI | Local development, migrations, type generation |
| Vercel CLI | Local preview, environment management |
| GitHub Actions | CI pipeline (lint, type-check, test) |
