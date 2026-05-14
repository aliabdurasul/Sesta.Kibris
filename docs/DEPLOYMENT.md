# DEPLOYMENT

## How to Deploy and Manage Environments

---

## 1. ENVIRONMENTS

| Environment | Purpose | URL | Database |
|---|---|---|---|
| Local | Developer machine | `http://localhost:3000` | Supabase local (Docker) |
| Preview | PR review | `https://<branch>.vercel.app` | Supabase staging project |
| Production | Live system | `https://sestakibris.com` | Supabase production project |

---

## 2. VERCEL CONFIGURATION

### Project Setup

- Framework: Next.js
- Build command: `pnpm build`
- Output directory: `.next`
- Install command: `pnpm install`
- Node.js version: 20.x

### Environment Variables (Vercel)

| Variable | Preview | Production | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Staging URL | Production URL | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Staging key | Production key | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging key | Production key | Server-only, never in client |
| `NEXT_PUBLIC_APP_URL` | Preview URL | Production URL | Canonical app URL |
| `CRON_SECRET` | Shared secret | Shared secret | Vercel Cron auth |

### Branch Deployment Strategy

| Branch | Deploys To | Auto-deploy |
|---|---|---|
| `main` | Production | Yes |
| `develop` | Preview (staging) | Yes |
| Feature branches | Preview (ephemeral) | Yes |

---

## 3. SUPABASE PROJECT MANAGEMENT

### Project Structure

| Project | Purpose | Linked Env |
|---|---|---|
| `sestakibris-prod` | Live production data | Vercel Production |
| `sestakibris-staging` | Testing and QA | Vercel Preview |

### Local Development

```bash
supabase start          # Start local Supabase (Docker)
supabase db reset       # Reset local DB and apply migrations
supabase gen types      # Generate TypeScript types from schema
supabase functions serve # Run Edge Functions locally
```

### Migration Flow

```
1. Write migration locally: supabase migration new <name>
2. Apply locally: supabase db reset
3. Test locally
4. Push to branch → PR review
5. On merge to develop: apply to staging (supabase db push --linked)
6. On merge to main: apply to production (supabase db push --linked)
```

---

## 4. CI/CD PIPELINE (GitHub Actions)

### On Pull Request

```yaml
jobs:
  - lint (ESLint)
  - type-check (tsc --noEmit)
  - test (unit tests)
  - build (next build — verifies no build errors)
```

### On Merge to `develop`

```yaml
jobs:
  - all PR checks
  - deploy to Vercel preview (automatic)
  - apply Supabase migrations to staging
  - run E2E tests against staging
```

### On Merge to `main`

```yaml
jobs:
  - all PR checks
  - deploy to Vercel production (automatic)
  - apply Supabase migrations to production
  - smoke test production endpoints
```

---

## 5. SUPABASE EDGE FUNCTIONS DEPLOYMENT

Edge Functions are deployed via Supabase CLI:

```bash
supabase functions deploy <function-name>
```

### Deployment Strategy

- Edge Functions are deployed independently of the Next.js app
- Each function has its own directory in `supabase/functions/<name>/`
- Deploy all functions on merge to main:
  ```bash
  supabase functions deploy create-order
  supabase functions deploy transition-order-status
  supabase functions deploy manage-product
  supabase functions deploy manage-courier
  supabase functions deploy onboard-merchant
  supabase functions deploy check-timeouts
  ```

---

## 6. DOMAIN AND DNS

| Domain | Service | Purpose |
|---|---|---|
| `sestakibris.com` | Vercel | Main application |
| `api.sestakibris.com` | Vercel | API routes (webhooks) |
| Supabase default URL | Supabase | Database, Auth, Edge Functions, Storage |

---

## 7. MONITORING AND ALERTS

### Vercel

- Build failure alerts → team notification
- Performance budgets (LCP < 2.5s, FID < 100ms)
- Error tracking via Vercel Analytics

### Supabase

- Database connection pool monitoring
- Realtime connection count
- Edge Function invocation errors
- Auth rate limiting alerts

### Application-Level

- Order timeout monitoring (cron function)
- Failed delivery rate tracking
- Merchant response time tracking

---

## 8. ROLLBACK STRATEGY

### Next.js (Vercel)

- Instant rollback to previous deployment via Vercel dashboard
- Every merge creates a deployment snapshot
- No downtime during rollback

### Database (Supabase)

- Migrations are forward-only in production
- Rollbacks require a new "undo" migration
- Always test migrations on staging before production
- For emergencies: point-in-time recovery (Supabase Pro feature)

### Edge Functions

- Deploy previous version of the function
- No traffic splitting — deployment is atomic

---

## 9. SECURITY CHECKLIST FOR DEPLOYMENT

- [ ] Service role key is NEVER in `NEXT_PUBLIC_*` variables
- [ ] `.env` file is in `.gitignore`
- [ ] Supabase dashboard access is restricted to admin team
- [ ] Vercel environment variables are scoped per environment
- [ ] GitHub branch protection on `main` (require PR + review)
- [ ] No secrets in commit history
- [ ] HTTPS enforced on all endpoints
