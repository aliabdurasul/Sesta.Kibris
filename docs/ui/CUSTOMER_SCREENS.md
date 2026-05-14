# CUSTOMER SCREENS

## Customer Interface Specifications

---

## 1. NAVIGATION

```
Bottom Tab Bar:
  [Ana Sayfa]  [Siparişlerim]  [Profil]
```

---

## 2. SCREEN LIST

### 2.1 Landing / Merchant Discovery

**Route**: `/` or `/merchants`

**Purpose**: Help customer find a merchant to order from.

**Content**:
- App header with SestaKibris branding
- Category filter chips: Tümü | Market | Su | Tüp
- List of active merchants (card format):
  - Merchant name
  - Category badge
  - Open/Closed indicator
  - Address (district)
- Empty state if no merchants in area

**Actions**:
- Tap merchant → go to storefront

---

### 2.2 Merchant Storefront

**Route**: `/[merchant-slug]`

**Purpose**: Browse merchant's products and add to cart.

**Content**:
- Merchant header: name, category, address, open/closed status
- Product list (cards):
  - Product image (or placeholder)
  - Product name
  - Price (formatted: "₺15,00")
  - Unit (e.g., "19L")
  - Stock status (if limited)
  - Add to cart button (with quantity stepper if already in cart)
- Floating cart summary bar (if cart has items):
  - Item count + total
  - "Sepeti Gör" (View Cart) button

**States**:
- Merchant closed → banner: "Bu mağaza şu anda kapalı" + disable add buttons
- Product out of stock → "Stokta yok" badge + disable add button

---

### 2.3 Cart

**Route**: `/[merchant-slug]/cart`

**Purpose**: Review cart before checkout.

**Content**:
- Merchant name (reminder of where they're ordering from)
- Cart items list:
  - Product name
  - Unit price × quantity = line total
  - Quantity stepper (+/-)
  - Remove button
- Cart summary:
  - Subtotal (labeled "Tahmini Toplam")
- "Sipariş Ver" (Place Order) button → goes to checkout

**States**:
- Empty cart → "Sepetiniz boş" + "Ürünlere Göz Atın" link
- Item became unavailable → warning banner + remove button

---

### 2.4 Checkout

**Route**: `/[merchant-slug]/checkout`

**Purpose**: Select address, add notes, confirm order.

**Content**:
- Delivery address section:
  - Selected address card (or "Adres Seçin" prompt)
  - "Adres Değiştir" button → address picker sheet
  - "Yeni Adres Ekle" option
- Customer notes textarea: "Teslimat notu (opsiyonel)"
- Order summary:
  - Items list (collapsed, expandable)
  - Total amount
- "Siparişi Onayla" (Confirm Order) button

**Requires auth**: Yes (redirect to login/register if not authenticated)

**On success**: Navigate to order tracking page

---

### 2.5 Order Tracking

**Route**: `/customer/orders/[id]`

**Purpose**: Real-time order status tracking.

**Content**:
- Status progress indicator (visual stepper):
  - Sipariş verildi ✓
  - Onaylandı (✓ or pending)
  - Hazırlanıyor
  - Yolda
  - Teslim edildi
- Current status message (human-readable Turkish)
- Estimated delivery info (future)
- Order details (expandable):
  - Items list
  - Delivery address
  - Total amount
  - Order time

**Realtime**: Subscribes to this order's status updates.

**States**:
- REJECTED: "Siparişiniz reddedildi" + reason + "Yeniden sipariş verebilirsiniz"
- CANCELLED: "Siparişiniz iptal edildi"
- Connection lost: "Son güncelleme: X dakika önce"

---

### 2.6 Order History

**Route**: `/customer/orders`

**Purpose**: View past orders.

**Content**:
- List of orders (reverse chronological):
  - Merchant name
  - Date
  - Item count
  - Total amount
  - Status badge (colored)
- Pagination (load more on scroll)

**Actions**:
- Tap order → order detail/tracking

---

### 2.7 Profile

**Route**: `/customer/profile`

**Purpose**: Account management.

**Content**:
- Name (editable)
- Phone (editable)
- Email (read-only)
- "Adreslerim" (My Addresses) link
- "Şifre Değiştir" link
- "Çıkış Yap" (Logout) button

---

### 2.8 Address Management

**Route**: `/customer/addresses`

**Purpose**: Manage delivery addresses.

**Content**:
- List of saved addresses:
  - Label (Ev, İş, etc.)
  - Address line
  - District
  - Default badge (if default)
  - Edit / Delete buttons
- "Yeni Adres Ekle" button

**Add/Edit Form**:
- Label (text input)
- Address line (text input)
- District (dropdown or text)
- City (pre-filled: Lefkoşa)
- Notes (text area)
- "Varsayılan adres olarak ayarla" checkbox

---

### 2.9 Login

**Route**: `/auth/login`

**Purpose**: Sign in.

**Content**:
- Email input
- Password input
- "Giriş Yap" button
- "Hesabınız yok mu? Kayıt olun" link
- "Şifremi unuttum" link

---

### 2.10 Register

**Route**: `/auth/register`

**Purpose**: Create customer account.

**Content**:
- Full name input
- Phone input
- Email input
- Password input
- Password confirmation input
- "Kayıt Ol" button
- "Zaten hesabınız var mı? Giriş yapın" link

---

## 3. CRITICAL PATH

```
Storefront → Add to Cart → View Cart → Checkout → Order Tracking
```

This path must be completable in **under 90 seconds** on first use and **under 5 taps** for returning customers with saved addresses.

---

## 4. UX PRINCIPLES FOR CUSTOMER

- **Confidence**: Customer must trust delivery will happen
- **Clarity**: Status is always human-readable
- **Speed**: Minimal steps to complete an order
- **No dead ends**: Every error has a next step
- **Familiar patterns**: Similar to food delivery apps they know
