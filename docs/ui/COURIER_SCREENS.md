# COURIER SCREENS

## Courier Interface Specifications

---

## 1. NAVIGATION

```
Bottom Tab Bar (2 tabs):
  [Teslimatlarım]  [Geçmiş]
```

Minimal navigation. Courier app has the fewest screens of any actor.

---

## 2. DESIGN CONSTRAINTS

- Must be usable one-handed while standing/walking
- Must work on low-end Android phones
- Must be readable in bright sunlight
- Buttons must be large enough to tap while moving
- No scrolling required to reach primary action

---

## 3. SCREEN LIST

### 3.1 Delivery Queue (Home)

**Route**: `/courier`

**Purpose**: See all assigned deliveries and their status.

**Content**:
- Connection status indicator (green/red dot)
- Active deliveries list (cards):
  - Status badge: "Atandı" (ASSIGNED) or "Yolda" (IN_TRANSIT)
  - Customer address (one line, truncated)
  - Item count
  - Time since assigned
  - Primary action visible without opening detail

**Card Layout**:
```
┌─────────────────────────────────────┐
│  🔵 ATANDI                          │
│  Gönyeli, Atatürk Cad. No:15       │
│  3 ürün • 5 dk önce                │
│  [Detay Gör]                         │
└─────────────────────────────────────┘
```

**States**:
- No deliveries: "Atanmış teslimat yok" (No assigned deliveries) + "Mağazanız size sipariş atadığında burada görünecek"
- Connection lost: Red banner "Bağlantı kesildi — yeni görevleri göremeyebilirsiniz"

**Realtime**: Subscribes to orders where `courier_id` = self AND status IN (ASSIGNED, IN_TRANSIT)

---

### 3.2 Delivery Detail

**Route**: `/courier/deliveries/[id]`

**Purpose**: Full delivery information and action buttons.

**Content**:

**Section 1: Address**
```
┌─────────────────────────────────────┐
│  📍 Teslimat Adresi                 │
│                                     │
│  Gönyeli, Atatürk Cad. No:15       │
│  Apartman giriş katta, sol kapı    │
│                                     │
│  [📋 Kopyala]  [🗺️ Navigasyon]    │
└─────────────────────────────────────┘
```

**Section 2: Customer**
```
┌─────────────────────────────────────┐
│  👤 Müşteri                          │
│  Ahmet Yılmaz                       │
│  [📞 Ara: +90 530 123 4567]        │
└─────────────────────────────────────┘
```

**Section 3: Order Items**
```
┌─────────────────────────────────────┐
│  📦 Sipariş İçeriği                 │
│                                     │
│  • Su 19L × 2                       │
│  • Su 5L × 3                        │
│                                     │
│  Toplam: ₺75,00 (nakit tahsilat)   │
└─────────────────────────────────────┘
```

**Section 4: Notes**
- Customer notes (if any): "Kapıyı çalmayın"
- Merchant notes (if any)

**Section 5: Actions (FIXED AT BOTTOM)**

If status = ASSIGNED:
```
┌─────────────────────────────────────┐
│  [ TESLİM ALDIM ]                   │  ← Large green button, full-width
└─────────────────────────────────────┘
```

If status = IN_TRANSIT:
```
┌─────────────────────────────────────┐
│  [ TESLİM ETTİM ]                   │  ← Large green button
│  [ Teslim Edilemedi ]                │  ← Secondary red button (smaller)
└─────────────────────────────────────┘
```

---

### 3.3 Failed Delivery Reason

**Triggered from**: "Teslim Edilemedi" button

**Purpose**: Record why delivery failed.

**Content**:
- "Neden teslim edilemedi?" header
- Large radio buttons:
  - Müşteri evde değil
  - Adres bulunamadı
  - Müşteri teslim almak istemedi
  - Adrese ulaşılamadı
  - Diğer (text input)
- [İptal] [Gönder] buttons (large)

**On submit**: Status → FAILED_DELIVERY, return to queue

---

### 3.4 Delivery History

**Route**: `/courier/history`

**Purpose**: View past deliveries (last 7 days).

**Content**:
- Date headers (grouped by day)
- Delivery cards:
  - Customer address (one line)
  - Time of delivery
  - Status badge: Teslim Edildi (green) or Başarısız (red)
- Simple list, no interaction needed (read-only)

**States**:
- No history: "Henüz teslimat geçmişi yok"

---

## 4. CRITICAL PATH

```
Delivery Notification → Open Detail → [Teslim Aldım] → Navigate → [Teslim Ettim]
```

A courier must **never be confused about what to do next**.

---

## 5. ACTION BUTTON SPECIFICATIONS

| Button | Size | Color | Position |
|---|---|---|---|
| Teslim Aldım | Full-width, 56px height | Green (success) | Fixed bottom |
| Teslim Ettim | Full-width, 56px height | Green (success) | Fixed bottom |
| Teslim Edilemedi | Full-width, 48px height | Red outline | Below primary |
| Navigasyon | Half-width, 44px height | Blue (primary) | Address section |
| Ara (Call) | Half-width, 44px height | Blue (primary) | Customer section |

---

## 6. NOTIFICATION BEHAVIOR

### New Assignment

- Push notification: "Yeni teslimat atandı"
- Vibration: 2 short pulses
- Tap notification → opens delivery detail directly
- Badge count updates on tab

### Unassigned (merchant took back)

- Push notification: "Teslimat geri alındı"
- Item disappears from queue
- No action required from courier

---

## 7. OFFLINE BEHAVIOR

- Active delivery details cached locally
- If connection drops during delivery:
  - Courier can still VIEW address, items, customer phone
  - Courier CANNOT submit actions (teslim aldım/ettim)
  - Banner: "İnternet bağlantısı yok — bağlandığınızda işlem yapabilirsiniz"
- On reconnect: queue refreshes, pending actions submit

---

## 8. WHAT IS NOT ON COURIER SCREENS

- Settings (merchant manages their profile)
- Catalog (not relevant)
- Other couriers' deliveries
- Analytics or metrics
- Profile editing
- Any configuration
- Maps integration embedded (uses device maps via deep link)
