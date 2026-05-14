# SestaKıbrıs

Hyperlocal commerce operating system for Northern Cyprus.

**Phase 0 — Foundation** (current)

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Edge Functions, Storage)
- **Deployment**: Vercel + Supabase Cloud

## Getting Started

```bash
# 1. Copy env file
cp .env.example .env.local
# Fill in values from Supabase dashboard

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript check |
| `npm run format` | Prettier format |
| `npm run db:reset` | Reset local Supabase DB |
| `npm run db:types` | Generate TypeScript types from schema |

## Phase Progress

- [x] Phase 0 — Foundation (scaffold, database, RLS, auth, deployment)
- [ ] Phase 1 — MVP (customer ordering, merchant ops, basic courier)
- [ ] Phase 2 — Scale (notifications, realtime, analytics)
- [ ] Phase 3 — Courier Network
- [ ] Phase 4 — Payments
- [ ] Phase 5 — Marketplace

## Architecture

See `/docs` for full system documentation.
