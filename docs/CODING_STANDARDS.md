# CODING STANDARDS

## Code Style, Patterns, and Conventions

---

## 1. LANGUAGE AND TYPE SAFETY

- **TypeScript** in strict mode for all code
- No `any` types — use `unknown` and narrow
- No type assertions (`as`) unless unavoidable and commented
- All function parameters and return types explicitly typed
- Generated Supabase types used for all database interactions

```typescript
// tsconfig.json essentials
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

---

## 2. FILE AND FOLDER NAMING

### Next.js App Router

| Type | Convention | Example |
|---|---|---|
| Route segments | lowercase, kebab-case | `app/merchant/order-queue/page.tsx` |
| Page files | `page.tsx` | `app/merchant/page.tsx` |
| Layout files | `layout.tsx` | `app/merchant/layout.tsx` |
| Loading states | `loading.tsx` | `app/merchant/loading.tsx` |
| Error boundaries | `error.tsx` | `app/merchant/error.tsx` |
| Server actions | `actions.ts` | `app/merchant/orders/actions.ts` |

### Components

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `OrderCard.tsx` |
| Component folders | PascalCase | `components/OrderCard/index.tsx` |
| Hooks | camelCase with `use` prefix | `hooks/useOrderSubscription.ts` |
| Utilities | camelCase | `utils/calculateTotal.ts` |
| Constants | UPPER_SNAKE_CASE | `constants/ORDER_STATES.ts` |
| Types/Interfaces | PascalCase | `types/Order.ts` |

### Supabase

| Type | Convention | Example |
|---|---|---|
| Migrations | Timestamped | `20260514190000_create_merchants.sql` |
| Edge Functions | kebab-case | `supabase/functions/create-order/index.ts` |
| Database tables | snake_case, plural | `order_items`, `customer_addresses` |
| Database columns | snake_case | `merchant_id`, `created_at` |

---

## 3. COMPONENT PATTERNS

### Component Structure

```typescript
// 1. Imports (external, then internal)
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

// 2. Types
interface OrderCardProps {
  order: Order
  onAccept: (orderId: string) => void
}

// 3. Component
export function OrderCard({ order, onAccept }: OrderCardProps) {
  // hooks first
  // derived state
  // handlers
  // render
}
```

### Rules

- One component per file (co-located sub-components allowed if small)
- Named exports, not default exports (except pages)
- Props interfaces defined in the same file as the component
- No business logic in components — delegate to hooks or server actions

---

## 4. STATE MANAGEMENT

### Client State

| State Type | Solution | Example |
|---|---|---|
| Server data | Supabase queries + Realtime | Orders, products, merchants |
| Form state | `react-hook-form` | Order checkout form |
| UI state | `useState` / `useReducer` | Modal open/close, tab selection |
| Cart state | `zustand` (persisted) | Customer shopping cart |
| Global UI | React Context | Theme, locale |

### Rules

- Server state is NEVER duplicated in client state management
- Cart is the only persistent client state (persisted to sessionStorage, not localStorage)
- No Redux — unnecessary complexity for this application
- Realtime subscriptions are managed in dedicated hooks

---

## 5. ERROR HANDLING

### API/Edge Function Errors

```typescript
// Consistent error response shape
type ApiError = {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}
```

### Client Error Handling

- Every async operation must handle loading, success, and error states
- Errors shown to users must be in Turkish
- No raw error codes displayed to end users
- Log technical details to console (development) or monitoring (production)
- Use error boundaries for unexpected React errors

### Error Message Mapping

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  'ORDER_INVALID_TRANSITION': 'Bu işlem şu anda yapılamaz',
  'MERCHANT_CLOSED': 'Bu mağaza şu anda kapalı',
  'PRODUCT_UNAVAILABLE': 'Bu ürün şu anda mevcut değil',
  'AUTH_REQUIRED': 'Lütfen giriş yapın',
  'RATE_LIMITED': 'Çok fazla istek gönderdiniz, lütfen bekleyin',
}
```

---

## 6. DATA FETCHING PATTERNS

### Server Components (Default)

```typescript
// Preferred for initial page load
export default async function MerchantOrdersPage() {
  const supabase = createServerClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false })

  return <OrderList orders={orders} />
}
```

### Client Components (When Realtime Needed)

```typescript
// For live-updating screens
'use client'
export function OrderQueue() {
  const orders = useOrderSubscription(merchantId)
  return <OrderList orders={orders} />
}
```

---

## 7. FORBIDDEN PATTERNS

These patterns must never appear in the codebase:

| Pattern | Why Forbidden |
|---|---|
| `localStorage.setItem('order', ...)` | Business state must be server-persisted |
| `// TODO: implement later` without issue link | Dead code, no accountability |
| `console.log` in production code | Use structured logging |
| `!important` in CSS | Tailwind utilities handle specificity |
| Inline styles | Use Tailwind classes |
| `fetch()` to Supabase (bypass client) | Loses auth context and type safety |
| Client-side price calculation shown as final | Security and consistency violation |
| `setTimeout` for polling | Use Realtime subscriptions |
| Commented-out code blocks | Use git history instead |
| Mock data in non-test files | No fake functionality |

---

## 8. IMPORT ORDER

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// 2. Third-party libraries
import { z } from 'zod'
import { useForm } from 'react-hook-form'

// 3. Internal - absolute imports (@/)
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { Order } from '@/types/Order'

// 4. Relative imports (same module)
import { OrderItem } from './OrderItem'
```

Enforced via ESLint `import/order` rule.

---

## 9. COMMIT CONVENTIONS

```
<type>(<scope>): <description>

feat(orders): add order rejection with reason
fix(auth): handle expired token refresh in middleware
chore(deps): update supabase-js to 2.45.0
docs(api): document create-order edge function
refactor(merchant): extract order queue into separate component
test(rls): add cross-tenant isolation tests
```

### Types

| Type | When |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Tooling, deps, config |
| `docs` | Documentation |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or fixing tests |
| `style` | Formatting, no logic change |

---

## 10. PR CONVENTIONS

- One feature/fix per PR
- PR title follows commit convention
- Description includes: what changed, why, how to test
- Screenshots for UI changes
- Max ~400 lines changed (split larger work)
- Must pass all CI checks before merge
- Requires at least one approval
