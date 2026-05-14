# PHASE 0 — SETUP

## Infrastructure Bootstrap

---

## 1. GOAL

Go from an empty repository to a deployable skeleton with authentication, database schema, and deployment pipeline — with zero business features.

---

## 2. SUCCESS CRITERIA

- [ ] Next.js app running locally with TypeScript
- [ ] Supabase project connected (local + cloud)
- [ ] All database tables created via migrations
- [ ] RLS policies applied and tested
- [ ] Auth configured with 4 roles
- [ ] Vercel deployment working (push to main → live)
- [ ] Environment variables properly configured
- [ ] CI pipeline passing (lint + type-check + build)
- [ ] Seed data available for local development

---

## 3. TASKS

### 3.1 Project Scaffold

- Initialize Next.js project with App Router
- Configure TypeScript in strict mode
- Install and configure Tailwind CSS
- Install Supabase client libraries (`@supabase/ssr`, `@supabase/supabase-js`)
- Configure ESLint + Prettier
- Set up pnpm as package manager
- Create project directory structure:
  ```
  src/
  ├── app/           (Next.js App Router pages)
  ├── components/    (Shared UI components)
  ├── hooks/         (Custom React hooks)
  ├── lib/           (Supabase client, utilities)
  ├── types/         (TypeScript type definitions)
  └── constants/     (Application constants)
  supabase/
  ├── migrations/    (Database migrations)
  ├── functions/     (Edge Functions)
  └── seed.sql       (Development seed data)
  ```

### 3.2 Supabase Setup

- Create Supabase project (or link to existing)
- Configure local development (`supabase init`, `supabase start`)
- Create database migrations for all core tables:
  - `merchants`
  - `products`
  - `customers`
  - `customer_addresses`
  - `couriers`
  - `orders`
  - `order_items`
  - `order_status_log`
- Create all indexes
- Apply all RLS policies
- Create helper functions (`auth.role()`, `auth.merchant_id()`, `auth.courier_id()`)
- Generate TypeScript types from schema

### 3.3 Auth Configuration

- Enable email/password auth in Supabase
- Configure JWT to include `app_metadata.role` claim
- Set up role assignment flow (Edge Function for admin use)
- Create Supabase Auth middleware for Next.js (token refresh)
- Set up route protection middleware (role-based redirects)

### 3.4 Deployment Pipeline

- Connect GitHub repo to Vercel
- Configure environment variables in Vercel (per environment)
- Set up branch deployment strategy (main → prod, develop → preview)
- Verify build + deploy works
- Configure custom domain (if ready)

### 3.5 CI Pipeline

- GitHub Actions workflow:
  - Lint (ESLint)
  - Type check (tsc --noEmit)
  - Build (next build)
- Branch protection rules on `main`

### 3.6 Development Seed Data

- Create seed script with:
  - 2 test merchants (grocery + water)
  - 10 products per merchant
  - 3 test customers with addresses
  - 2 couriers per merchant
  - 20 orders in various states
- Seed uses realistic Turkish names and addresses

---

## 4. WHAT IS NOT BUILT

- Any UI screens (no pages beyond placeholder)
- Any business logic (no Edge Functions beyond auth setup)
- Any product features
- Any Realtime subscriptions
- Any notification system
- Any Stripe integration

---

## 5. DEPENDENCIES

| Dependency | Version | Purpose |
|---|---|---|
| `next` | latest | Framework |
| `react`, `react-dom` | latest | UI library |
| `typescript` | latest | Type safety |
| `tailwindcss` | latest | Styling |
| `@supabase/ssr` | latest | Server-side Supabase |
| `@supabase/supabase-js` | latest | Client-side Supabase |
| `eslint` | latest | Linting |
| `prettier` | latest | Formatting |

---

## 6. ESTIMATED EFFORT

| Task | Effort |
|---|---|
| Project scaffold | 2-3 hours |
| Database migrations + RLS | 4-6 hours |
| Auth configuration | 2-3 hours |
| Deployment pipeline | 1-2 hours |
| CI pipeline | 1 hour |
| Seed data | 1-2 hours |
| **Total** | **~1-2 days** |

---

## 7. VALIDATION

Phase 0 is complete when:
1. `pnpm dev` starts the app locally without errors
2. `supabase db reset` applies all migrations cleanly
3. `pnpm build` succeeds with zero TypeScript errors
4. Pushing to `main` triggers successful Vercel deployment
5. Auth login works with a test account
6. RLS tests pass (merchant A cannot see merchant B's data)
