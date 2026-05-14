# AUTH AND ROLES

## Authentication and Authorization Model

---

## 1. AUTH PROVIDER

Supabase Auth with email/password authentication (Phase 1). Magic link / OTP planned for Phase 2.

---

## 2. ROLE MODEL

| Role | Description | Assignment Method |
|---|---|---|
| `customer` | Default for all sign-ups | Automatic on registration |
| `merchant` | Store owner/operator | Admin assigns during onboarding |
| `courier` | Delivery personnel | Merchant creates via dashboard |
| `admin` | Platform operator | Manual database assignment |

### Role Hierarchy

Roles are **flat, not hierarchical**. An admin is not a "super-merchant." Each role has completely separate permissions and data visibility.

### Role Storage

Roles are stored in the JWT `app_metadata.role` claim, set via Supabase Auth admin API during account creation or role assignment.

```json
{
  "app_metadata": {
    "role": "merchant",
    "merchant_id": "uuid-here"
  }
}
```

For couriers:
```json
{
  "app_metadata": {
    "role": "courier",
    "merchant_id": "uuid-here",
    "courier_id": "uuid-here"
  }
}
```

---

## 3. SESSION STRATEGY

### JWT Lifecycle

| Parameter | Value |
|---|---|
| Access token expiry | 1 hour |
| Refresh token expiry | 7 days |
| Token refresh | Automatic via `@supabase/ssr` middleware |

### Session Rules

- Merchant and courier sessions are completely separate — no elevation possible
- No shared sessions between actors
- A single browser/device = one active session
- Token refresh happens transparently in middleware before pages render
- If refresh fails → redirect to login

### Middleware Flow (Next.js)

```
Request → Middleware checks session → 
  Valid? → Refresh if needed → Continue to page
  Invalid? → Redirect to /login
  Wrong role for route? → Redirect to correct dashboard
```

---

## 4. REGISTRATION FLOWS

### 4.1 Customer Registration

1. Customer visits merchant storefront
2. At checkout, prompted to sign up (email + password + name + phone)
3. Account created with `role: customer`
4. Customer proceeds to place order
5. No admin involvement required

### 4.2 Merchant Onboarding

1. Admin creates merchant record in admin panel
2. Admin enters merchant owner's email
3. System sends invitation email with temporary password
4. Merchant logs in, sets permanent password
5. `app_metadata.role` = `merchant`, `app_metadata.merchant_id` = their merchant UUID
6. Merchant lands on their dashboard

### 4.3 Courier Creation

1. Merchant opens courier management in dashboard
2. Merchant enters courier name, phone, email
3. Edge Function creates auth account with `role: courier`
4. Courier receives credentials (SMS or in-person from merchant)
5. Courier installs PWA and logs in
6. `app_metadata` includes `merchant_id` linking to their employer

### 4.4 Admin Assignment

1. Manually update `app_metadata.role` to `admin` in Supabase dashboard
2. No self-service admin creation
3. Requires direct database access

---

## 5. AUTHORIZATION ENFORCEMENT

### 5.1 Layer Model

```
┌────────────────────────────────────────┐
│ Layer 1: Route Protection (Middleware) │  ← Convenience, NOT security
├────────────────────────────────────────┤
│ Layer 2: Edge Function Validation      │  ← Business logic checks
├────────────────────────────────────────┤
│ Layer 3: RLS Policies (PostgreSQL)     │  ← TRUE security boundary
└────────────────────────────────────────┘
```

### 5.2 Route Protection

Next.js middleware checks the user's role and redirects if accessing an unauthorized namespace:

| Route Prefix | Required Role |
|---|---|
| `/merchant/*` | merchant |
| `/courier/*` | courier |
| `/admin/*` | admin |
| `/customer/*` | customer |
| `/[merchant-slug]` | public (no auth for browsing) |

### 5.3 RLS Enforcement

RLS is the actual security boundary. Even if middleware is bypassed, RLS prevents data access.

See `RLS_POLICIES.md` for complete policy definitions.

---

## 6. PASSWORD POLICY

| Requirement | Value |
|---|---|
| Minimum length | 8 characters |
| Complexity | At least one letter + one number |
| Reset mechanism | Email-based password reset |
| Lockout | Supabase default rate limiting |

---

## 7. SECURITY RULES

- Service role key is NEVER exposed to any client-side code
- Service role key is used ONLY in Edge Functions for admin operations
- JWTs are stored in HTTP-only cookies (via `@supabase/ssr`), not localStorage
- Role claims in JWT are set server-side only — clients cannot modify their role
- All role changes require Edge Function with service role key
- Courier cannot elevate to merchant role
- Customer cannot access merchant or courier routes even with URL manipulation
- Failed auth attempts are rate-limited by Supabase

---

## 8. MULTI-TENANT AUTH RULE

A merchant can only see their own data. This is enforced at the **RLS layer**, not the application layer.

The application layer provides filtered queries as a performance optimization. RLS provides the actual security guarantee.

If you removed all application-level WHERE clauses, the system would still be secure (just slower).
