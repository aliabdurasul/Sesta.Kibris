# API CONTRACTS

## Edge Function and API Route Specifications

---

## 1. OVERVIEW

All business logic runs through Supabase Edge Functions. Next.js API routes are used only for webhooks and server-side operations that need Next.js context.

### Base URLs

| Environment | Edge Functions | Next.js API |
|---|---|---|
| Production | `https://kftzfokvwxijxskdvame.supabase.co/functions/v1/` | `https://sestakibris.com/api/` |
| Local | `http://localhost:54321/functions/v1/` | `http://localhost:3000/api/` |

### Authentication

All Edge Functions require a valid JWT in the `Authorization: Bearer <token>` header, except where explicitly marked as public.

---

## 2. ORDER FUNCTIONS

### 2.1 `create-order`

Creates a new order with validated items and calculated totals.

| Field | Value |
|---|---|
| Method | POST |
| Auth | Required (customer) |
| Rate limit | 5 orders per minute per customer |

**Request Body:**
```json
{
  "merchant_id": "uuid",
  "address_id": "uuid",
  "items": [
    { "product_id": "uuid", "quantity": 2 },
    { "product_id": "uuid", "quantity": 1 }
  ],
  "customer_notes": "Kapıyı çalmayın lütfen"
}
```

**Success Response (201):**
```json
{
  "order": {
    "id": "uuid",
    "status": "PENDING",
    "total_amount": 15000,
    "created_at": "2026-05-14T19:00:00Z"
  }
}
```

**Error Responses:**
| Code | Reason |
|---|---|
| 400 | Invalid items, empty cart, merchant closed, product unavailable |
| 401 | Not authenticated |
| 403 | Not a customer role |
| 404 | Merchant or address not found |
| 422 | Validation failure (details in response) |

**Server-side logic:**
1. Validate merchant exists and `is_open = true`
2. Validate all products belong to merchant and `is_available = true`
3. Fetch current prices from `products` table
4. Calculate `line_total` per item and `total_amount`
5. Snapshot delivery address from `customer_addresses`
6. Snapshot product names and prices into `order_items`
7. Insert order with status PENDING
8. Insert all order_items
9. Insert initial order_status_log entry
10. Return created order

### 2.2 `transition-order-status`

Transitions an order to a new state.

| Field | Value |
|---|---|
| Method | POST |
| Auth | Required (merchant, courier, or admin depending on transition) |

**Request Body:**
```json
{
  "order_id": "uuid",
  "new_status": "CONFIRMED",
  "data": {
    "courier_id": "uuid",
    "rejection_reason": "string",
    "failure_reason": "string",
    "note": "string"
  }
}
```

**Success Response (200):**
```json
{
  "order": {
    "id": "uuid",
    "status": "CONFIRMED",
    "accepted_at": "2026-05-14T19:05:00Z"
  }
}
```

**Error Responses:**
| Code | Reason |
|---|---|
| 400 | Invalid transition, missing required fields |
| 401 | Not authenticated |
| 403 | Actor not authorized for this transition |
| 404 | Order not found |
| 409 | Order already in target state or terminal state |

---

## 3. MERCHANT FUNCTIONS

### 3.1 `manage-product`

Create or update a product in merchant's catalog.

| Field | Value |
|---|---|
| Method | POST (create) / PUT (update) |
| Auth | Required (merchant) |

**Request Body (create):**
```json
{
  "name": "Su 19L",
  "description": "Damacana su",
  "price": 15000,
  "unit": "19L",
  "stock_count": null,
  "is_available": true,
  "display_order": 1
}
```

**Request Body (update):**
```json
{
  "product_id": "uuid",
  "price": 17000,
  "is_available": false
}
```

### 3.2 `manage-courier`

Create or update a courier for the merchant.

| Field | Value |
|---|---|
| Method | POST (create) / PUT (update) |
| Auth | Required (merchant) |

**Request Body (create):**
```json
{
  "full_name": "Ahmet Yılmaz",
  "phone": "+905301234567",
  "email": "ahmet@example.com"
}
```

**Server-side logic:**
1. Create auth account with `role: courier` and `merchant_id` in metadata
2. Create courier record linked to merchant
3. Return courier details (credentials sent via email)

### 3.3 `toggle-store-status`

Open or close the merchant's store.

| Field | Value |
|---|---|
| Method | POST |
| Auth | Required (merchant) |

**Request Body:**
```json
{
  "is_open": true
}
```

---

## 4. ADMIN FUNCTIONS

### 4.1 `onboard-merchant`

Creates a new merchant and their auth account.

| Field | Value |
|---|---|
| Method | POST |
| Auth | Required (admin — service role) |

**Request Body:**
```json
{
  "name": "Güneş Market",
  "slug": "gunes-market",
  "category": "grocery",
  "address": "Gönyeli, Lefkoşa",
  "phone": "+905301234567",
  "owner_email": "owner@example.com",
  "owner_name": "Mehmet Güneş"
}
```

**Server-side logic:**
1. Create auth account for owner
2. Set `app_metadata.role = merchant`
3. Create merchant record
4. Set `app_metadata.merchant_id` on auth account
5. Send invitation email
6. Return merchant details

### 4.2 `override-order`

Admin override for order state (emergency use).

| Field | Value |
|---|---|
| Method | POST |
| Auth | Required (admin — service role) |

**Request Body:**
```json
{
  "order_id": "uuid",
  "new_status": "CANCELLED",
  "note": "Merchant unresponsive, customer requested cancellation"
}
```

---

## 5. NEXT.JS API ROUTES

### 5.1 `/api/webhooks/stripe` (Phase 4)

Handles Stripe webhook events.

| Field | Value |
|---|---|
| Method | POST |
| Auth | Stripe webhook signature verification |

### 5.2 `/api/cron/check-timeouts`

Called by Vercel Cron to check for timed-out orders.

| Field | Value |
|---|---|
| Method | POST |
| Auth | Cron secret header verification |

---

## 6. ERROR FORMAT

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ORDER_INVALID_TRANSITION",
    "message": "Cannot transition from DELIVERED to CANCELLED",
    "details": {
      "current_status": "DELIVERED",
      "requested_status": "CANCELLED"
    }
  }
}
```

### Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `AUTH_REQUIRED` | 401 | No valid JWT provided |
| `AUTH_FORBIDDEN` | 403 | Valid JWT but wrong role |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_FAILED` | 422 | Input validation error |
| `ORDER_INVALID_TRANSITION` | 400 | State machine violation |
| `ORDER_TERMINAL_STATE` | 409 | Cannot modify terminal order |
| `MERCHANT_CLOSED` | 400 | Merchant is not accepting orders |
| `PRODUCT_UNAVAILABLE` | 400 | Product not available |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 7. RATE LIMITING

| Endpoint | Limit | Window |
|---|---|---|
| create-order | 5 requests | 1 minute |
| transition-order-status | 30 requests | 1 minute |
| manage-product | 60 requests | 1 minute |
| Public catalog queries | 100 requests | 1 minute |

Rate limiting enforced per authenticated user (by JWT sub claim).
