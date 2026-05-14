# TESTING STRATEGY

## What Is Tested and How

---

## 1. TESTING PHILOSOPHY

- Test the things that would be expensive to break in production
- Business logic (state machine, calculations) gets the most coverage
- UI tests focus on critical paths, not pixel perfection
- RLS policies are tested as rigorously as application code
- No test should depend on external services being available

---

## 2. TEST PYRAMID

```
         ┌─────────┐
         │   E2E   │  ← Few, critical paths only
         ├─────────┤
         │ Integr. │  ← Edge Functions, RLS policies
         ├─────────┤
         │  Unit   │  ← Business logic, utilities, validations
         └─────────┘
```

| Layer | Count | Speed | What |
|---|---|---|---|
| Unit | Many | Fast (ms) | Pure functions, validation, state machine logic |
| Integration | Medium | Moderate (sec) | Edge Functions, RLS policies, database operations |
| E2E | Few | Slow (min) | Complete user flows (order placement → delivery) |

---

## 3. UNIT TESTS

### What to Unit Test

| Target | Examples |
|---|---|
| State machine validation | Valid/invalid transitions, actor authorization |
| Price calculation | Line totals, order totals, edge cases (rounding) |
| Input validation schemas | Zod schemas, form validation rules |
| Utility functions | Formatters, date helpers, slug generation |

### Tools

| Tool | Purpose |
|---|---|
| Vitest | Test runner (fast, native ESM, TypeScript) |
| Zod | Schema validation (tested via input/output assertions) |

### Conventions

- Test files co-located with source: `utils/calculate-total.ts` → `utils/calculate-total.test.ts`
- Describe blocks mirror function names
- Each test case tests one behavior

---

## 4. INTEGRATION TESTS

### What to Integration Test

| Target | Examples |
|---|---|
| Edge Functions | create-order validates inputs and creates correct records |
| RLS Policies | Merchant A cannot read Merchant B's orders |
| State transitions | Full transition flow with database state verification |
| Auth flows | Role assignment, token generation, access control |

### Tools

| Tool | Purpose |
|---|---|
| Supabase CLI + pgTAP | RLS policy testing in PostgreSQL |
| Vitest + Supabase client | Edge Function integration tests |
| Test containers (local Supabase) | Isolated database per test run |

### RLS Test Pattern

```sql
-- Test: Merchant A cannot see Merchant B's products
SET request.jwt.claims = '{"role": "merchant", "app_metadata": {"merchant_id": "merchant-a-id"}}';
SELECT * FROM products WHERE merchant_id = 'merchant-b-id';
-- EXPECT: 0 rows returned
```

---

## 5. END-TO-END TESTS

### What to E2E Test

Only critical user paths that, if broken, would make the system non-functional:

| Flow | Description |
|---|---|
| Customer order placement | Browse → Cart → Checkout → Order created |
| Merchant order acceptance | Login → See order → Accept → Mark ready |
| Courier delivery | Login → See assignment → Confirm delivery |
| Full lifecycle | Order PENDING → DELIVERED (all actors) |

### Tools

| Tool | Purpose |
|---|---|
| Playwright | Browser automation, multi-role testing |
| Supabase test project | Dedicated staging database for E2E |

### E2E Constraints

- Run against staging environment, not production
- Use dedicated test accounts (not real merchant data)
- Clean up test data after each run
- Run on merge to `develop`, not on every PR (too slow)

---

## 6. WHAT WE DO NOT TEST

| Category | Reason |
|---|---|
| Supabase Auth internals | Third-party responsibility |
| Supabase Realtime delivery | Third-party responsibility |
| Vercel deployment | Platform responsibility |
| Tailwind CSS rendering | Visual review in PR previews |
| Third-party library internals | Trust versioned dependencies |

---

## 7. CI PIPELINE

### On Every Pull Request

```
lint → type-check → unit tests → build
```
Must pass before merge is allowed.

### On Merge to `develop`

```
lint → type-check → unit tests → build → deploy to staging → integration tests → E2E tests
```

### On Merge to `main`

```
lint → type-check → unit tests → build → deploy to production → smoke tests
```

---

## 8. TEST DATA STRATEGY

### Local Development

- Seed script creates: 2 merchants, 10 products each, 2 couriers, 5 customers, 20 orders in various states
- Seed script is idempotent (can run multiple times safely)
- Seed data uses realistic Turkish names and addresses

### Staging

- Subset of seed data for QA
- Dedicated test accounts with known credentials
- Data reset weekly or on-demand

### Production

- No test data ever
- No seed scripts run against production
- All production data is real merchant/customer data

---

## 9. COVERAGE TARGETS

| Layer | Target | Notes |
|---|---|---|
| Business logic (state machine, calculations) | >90% | Critical path, must be comprehensive |
| Edge Functions | >80% | All happy paths + common error paths |
| RLS Policies | 100% | Every policy must have positive + negative tests |
| UI Components | >60% | Focus on interactive elements, not styling |
| Overall | >75% | Measured by lines, reported in CI |

---

## 10. TEST NAMING CONVENTION

```
describe('transition-order-status')
  it('should transition PENDING to CONFIRMED when actor is merchant')
  it('should reject PENDING to DELIVERED as invalid transition')
  it('should reject transition when actor is customer')
  it('should require rejection_reason when transitioning to REJECTED')
```

Pattern: `should [expected behavior] when [condition]`
