# CUSTOMER SYSTEM

## Customer-Facing Features Specification

---

## 1. OVERVIEW

The Customer System handles everything a customer does: discovering merchants, browsing products, placing orders, tracking delivery, and managing their account.

---

## 2. CAPABILITIES

### 2.1 Merchant Discovery

- View list of active merchants in their area
- Filter by category (grocery, water, gas)
- See merchant open/closed status
- Access merchant storefront via slug URL (`/gunes-market`)

### 2.2 Product Browsing

- View merchant's product catalog
- See product name, price, unit, description, image
- See availability status (in stock / out of stock)
- Products sorted by merchant-defined display order

### 2.3 Cart Management

- Add products to cart (per-merchant cart)
- Adjust quantities
- Remove items
- See running total (calculated client-side for UX, recalculated server-side on submit)
- Cart persisted in sessionStorage (survives page refresh within session)
- Cart is single-merchant — adding from a different merchant replaces the cart (with confirmation)

### 2.4 Order Placement

- Select delivery address (from saved addresses or add new)
- Add customer notes (delivery instructions)
- Review order summary before submission
- Submit order → creates PENDING order server-side
- Receive immediate confirmation with order ID

### 2.5 Order Tracking

- Real-time status updates via Supabase Realtime subscription
- Human-readable Turkish status messages:
  - PENDING → "Siparişiniz mağazaya iletildi"
  - CONFIRMED → "Siparişiniz onaylandı, hazırlanıyor"
  - READY → "Siparişiniz hazır, kurye atanıyor"
  - ASSIGNED → "Kuryeniz atandı"
  - IN_TRANSIT → "Siparişiniz yolda"
  - DELIVERED → "Siparişiniz teslim edildi"
  - REJECTED → "Siparişiniz reddedildi: [reason]"
  - CANCELLED → "Siparişiniz iptal edildi"
- View delivery address and order items on tracking page

### 2.6 Order History

- List of all past orders (paginated)
- Order detail view (items, totals, status, timestamps)
- Reorder functionality (future — add previous order items to cart)

### 2.7 Address Management

- Add, edit, delete delivery addresses
- Set default address
- Address fields: label, address line, district, city, notes

### 2.8 Profile Management

- View and edit name and phone number
- Password change
- Logout

---

## 3. AUTHENTICATION FLOW

1. Customer browses catalog without authentication (public)
2. At checkout, prompted to sign in or register
3. Registration: email + password + full name + phone
4. After auth, customer proceeds to address selection and order submission
5. Subsequent visits: auto-authenticated via session cookie

---

## 4. WHAT CUSTOMERS CANNOT DO

- Modify an order after merchant accepts it
- Select a specific courier
- Schedule delivery for a future time (Phase 1)
- Pay digitally (Phase 1 — COD only)
- See merchant internal operations
- Cancel an order after it's been confirmed (must contact merchant)
- Rate or review (Phase 2)
- Chat with merchant (not in scope)

---

## 5. EMPTY STATES

| Screen | Empty State Message | Action |
|---|---|---|
| No merchants found | "Yakınızda aktif mağaza bulunamadı" | — |
| Empty cart | "Sepetiniz boş" | "Ürünlere göz atın" button |
| No addresses | "Henüz adres eklemediniz" | "Adres Ekle" button |
| No orders | "Henüz sipariş vermediniz" | "Alışverişe Başla" button |

---

## 6. ERROR STATES

| Scenario | Customer Sees |
|---|---|
| Order submission fails | "Sipariş gönderilemedi — lütfen tekrar deneyin" + retry button |
| Merchant closed during cart | "Bu mağaza şu anda kapalı" on submit attempt |
| Product became unavailable | "Bazı ürünler artık mevcut değil" + which items |
| Network disconnected | "İnternet bağlantınız kesildi" |
| Session expired | Redirect to login with "Lütfen tekrar giriş yapın" |

---

## 7. DATA OWNERSHIP

| Data | Owned By | Customer Can |
|---|---|---|
| Customer profile | Customer | Read, Update |
| Addresses | Customer | CRUD |
| Orders | Order System | Read (own only) |
| Cart | Client (sessionStorage) | CRUD (ephemeral) |
| Product catalog | Merchant | Read only |
