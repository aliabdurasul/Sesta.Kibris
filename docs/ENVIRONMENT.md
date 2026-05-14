# ENVIRONMENT

## Environment Variables and Secrets Management

---

## 1. VARIABLE NAMING CONVENTION

| Prefix | Meaning | Accessible From |
|---|---|---|
| `NEXT_PUBLIC_` | Exposed to client-side JavaScript | Browser + Server |
| No prefix | Server-only (API routes, middleware, Edge Functions) | Server only |

**Rule**: Any variable without `NEXT_PUBLIC_` prefix is NEVER available in client bundles.

---

## 2. COMPLETE VARIABLE LIST

### 2.1 Supabase

| Variable | Visibility | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Full database access, bypasses RLS |

### 2.2 Application

| Variable | Visibility | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public | Canonical application URL |
| `NEXT_PUBLIC_APP_ENV` | Public | `development`, `staging`, `production` |

### 2.3 Cron / Internal

| Variable | Visibility | Description |
|---|---|---|
| `CRON_SECRET` | Server only | Authenticates Vercel Cron requests |

### 2.4 Stripe (Phase 4)

| Variable | Visibility | Description |
|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Stripe publishable key |
| `STRIPE_SECRET_KEY` | **Server only** | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | **Server only** | Stripe webhook signature verification |

### 2.5 Notifications (Phase 2+)

| Variable | Visibility | Description |
|---|---|---|
| `VAPID_PUBLIC_KEY` | Public | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | Server only | Web Push VAPID private key |

---

## 3. `.env` FILE STRUCTURE

### Local Development (`.env.local`)

```env
# Supabase (local or linked project)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# Cron
CRON_SECRET=local-cron-secret

# Stripe (Phase 4 — test mode)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### File Hierarchy (Next.js precedence)

| File | Purpose | Git-tracked? |
|---|---|---|
| `.env` | Defaults (non-sensitive) | Yes |
| `.env.local` | Local overrides (secrets) | **No** |
| `.env.development` | Dev-specific defaults | Yes |
| `.env.production` | Prod-specific defaults | Yes |

---

## 4. SECURITY RULES

### Never Commit

- `.env.local` — contains actual secrets
- Any file with service role keys
- Any file with Stripe secret keys
- Any file with VAPID private keys

### `.gitignore` Must Include

```
.env.local
.env.*.local
```

### Secret Rotation

| Secret | Rotation Trigger | How to Rotate |
|---|---|---|
| Supabase service role key | Suspected compromise | Regenerate in Supabase dashboard, update Vercel + Edge Functions |
| Stripe secret key | Suspected compromise | Roll in Stripe dashboard, update Vercel |
| CRON_SECRET | Periodic (quarterly) | Update in Vercel and cron configuration |
| VAPID keys | Suspected compromise | Regenerate, users re-subscribe to push |

---

## 5. PER-ENVIRONMENT VALUES

| Variable | Local | Staging | Production |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `localhost:54321` | Staging Supabase URL | Production Supabase URL |
| `NEXT_PUBLIC_APP_URL` | `localhost:3000` | `*.vercel.app` | `sestakibris.com` |
| `NEXT_PUBLIC_APP_ENV` | `development` | `staging` | `production` |

---

## 6. SUPABASE EDGE FUNCTION SECRETS

Edge Functions have their own secret management:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set NOTIFICATION_API_KEY=...
```

Edge Function secrets are stored in Supabase's secret manager and accessed via `Deno.env.get()`.

---

## 7. VALIDATION

On application startup, validate all required environment variables are present:

```typescript
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const serverVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'CRON_SECRET',
];
```

Missing variables should cause build failure or clear error at startup — never silently continue with undefined values.
