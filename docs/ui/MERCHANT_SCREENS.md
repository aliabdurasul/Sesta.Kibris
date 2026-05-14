# MERCHANT SCREENS

## Merchant Interface Specifications

---

## 1. NAVIGATION

```
Bottom Tab Bar (mobile):
  [Siparişler]  [Ürünler]  [Kuryeler]  [Ayarlar]
```

---

## 2. SCREEN LIST

### 2.1 Order Queue (Home)

**Route**: `/merchant`

**Purpose**: Real-time incoming order management. This is where merchants spend 80% of their time.

**Content**:
- Store status toggle (Açık/Kapalı) at top
- Active order count badge
- Segmented filter: Bekleyenler | Hazırlanan | Yolda | Tümü
- Order cards (sorted by time, newest first):
  - Status badge (colored)
  - Order short ID
  - Customer name
  - Item count + total amount
  - Time since created / time since last action
  - Primary action button (contextual to state)

**Realtime**: Subscribes to all orders for this merchant.

**New Order Notification**:
- Sound plays
- Card animates in at top
- Badge count increments
- If merchant hasn't looked: repeat sound every 60s (Phase 2)

**Contextual Actions per State**:

| State | Primary Action | Secondary |
|---|---|---|
| PENDING | [Kabul Et] | [Reddet] |
| CONFIRMED | [Hazır İşaretle] | — |
| READY | [Kurye Ata] | — |
| ASSIGNED | — (waiting for courier) | [Geri Al] |
| IN_TRANSIT | — (in delivery) | — |
| FAILED_DELIVERY | [Tekrar Gönder] | [İptal Et] |

---

### 2.2 Order Detail

**Route**: `/merchant/orders/[id]`

**Purpose**: Full order details and action interface.

**Content**:
- Status badge + timeline (visual steps)
- Customer info: name, phone (tap to call)
- Delivery address (full)
- Customer notes (if any)
- Order items table:
  - Product name × quantity = line total
- Order total
- Timestamps (created, accepted, ready, assigned, delivered)
- Action buttons (based on current state)
- Status history log (expandable)

**Actions** (state-dependent):
- Accept: one tap → CONFIRMED
- Reject: tap → reason selection → confirm → REJECTED
- Mark Ready: one tap → READY
- Assign Courier: tap → courier selector → confirm → ASSIGNED
- Cancel: tap → confirm dialog → CANCELLED

---

### 2.3 Reject Order Modal

**Triggered from**: Order detail or queue

**Content**:
- "Neden reddediyorsunuz?" (Why are you rejecting?)
- Radio buttons:
  - Ürünler stokta yok
  - Mağaza kapanıyor
  - Yoğunluk nedeniyle
  - Teslimat bölgesi dışında
  - Diğer (custom text input)
- [İptal] [Reddet] buttons

---

### 2.4 Assign Courier Sheet

**Triggered from**: Order detail (READY state)

**Content**:
- "Kurye Seçin" header
- List of active couriers:
  - Courier name
  - Current active delivery count
  - Status indicator (idle / busy)
- Tap to select → confirmation → assigned

---

### 2.5 Product Catalog

**Route**: `/merchant/catalog`

**Purpose**: Manage product listing.

**Content**:
- Product list (with drag handle for reordering):
  - Product image thumbnail
  - Product name
  - Price
  - Availability toggle (switch)
  - Stock count (if limited)
- "Yeni Ürün Ekle" button (floating or at top)

**Actions**:
- Tap product → edit form
- Toggle availability → instant update
- Drag to reorder → saves display_order

---

### 2.6 Add/Edit Product

**Route**: `/merchant/catalog/new` or `/merchant/catalog/[id]`

**Purpose**: Create or modify a product.

**Content**:
- Image upload area (tap to add/change photo)
- Name input (required)
- Price input (required, numeric, in TL — converted to kuruş)
- Unit input (required, e.g., "19L", "kg", "adet")
- Description textarea (optional)
- Stock count input (optional, empty = unlimited)
- "Kaydet" (Save) button

**Validation**:
- Name: required, min 2 characters
- Price: required, must be > 0
- Unit: required

---

### 2.7 Courier Management

**Route**: `/merchant/couriers`

**Purpose**: Manage courier roster.

**Content**:
- Courier list:
  - Name
  - Phone
  - Status badge (Aktif / Devre Dışı)
  - Current delivery count
  - Activate/Deactivate toggle
- "Yeni Kurye Ekle" button

---

### 2.8 Add Courier

**Route**: `/merchant/couriers/new`

**Purpose**: Create a new courier account.

**Content**:
- Name input (required)
- Phone input (required)
- Email input (required)
- "Kurye Hesabı Oluştur" button
- Note: "Kurye giriş bilgileri e-posta ile gönderilecek"

---

### 2.9 Settings

**Route**: `/merchant/settings`

**Purpose**: Store configuration.

**Content**:
- Store Information section:
  - Name (display, editable)
  - Address (editable)
  - Phone (editable)
- Operations section:
  - Order timeout (minutes, slider or input)
  - Default open/closed status
- Account section:
  - Email (read-only)
  - "Şifre Değiştir" link
  - "Çıkış Yap" button
- Phase 2+ : subscription info, payment method

---

## 3. CRITICAL PATH

```
New Order Notification → Order Detail → [Kabul Et] → [Hazır İşaretle] → [Kurye Ata]
```

A merchant must be able to accept an incoming order in **under 10 seconds**.

---

## 4. UX PRINCIPLES FOR MERCHANT

- **Speed**: Order acceptance must be instant (one tap)
- **Urgency**: New orders must feel urgent (color, sound, badge)
- **Clarity**: Only show valid actions for current state
- **Density**: Operational screens can show more info per screen than customer UI
- **Reliability**: Connection status always visible, never silent failures
