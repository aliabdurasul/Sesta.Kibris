# ADMIN SCREENS

## Admin Panel Specifications

---

## 1. NAVIGATION

Desktop-first sidebar layout:

```
Sidebar:
  ├── Dashboard
  ├── Mağazalar (Merchants)
  ├── Siparişler (Orders)
  ├── Sistem (System)
  └── Ayarlar (Settings)
```

---

## 2. DESIGN APPROACH

- Desktop-first (1200px+ primary viewport)
- Data-dense: tables, metrics, charts
- Functional over beautiful
- Quick access to critical actions
- Responsive down to tablet (1024px) but not mobile-optimized

---

## 3. SCREEN LIST

### 3.1 Dashboard

**Route**: `/admin`

**Purpose**: Platform health at a glance.

**Content**:

**Metrics Row (live updating)**:
```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Aktif   │  │ Bekleyen │  │  Bugün   │  │  Zaman   │
│ Sipariş  │  │ Sipariş  │  │  Teslim  │  │  Aşımı   │
│    47    │  │    5     │  │   124    │  │    2     │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**Alerts Panel** (if any):
- Timed-out orders (PENDING beyond threshold)
- High rejection rates
- System errors in last hour

**Recent Orders** (last 10, live updating):
- Table: ID, Merchant, Customer, Status, Time
- Click row → order detail

**Merchant Status**:
- Open merchants count
- Total active merchants
- Merchants with 0 orders this week (potential churn)

---

### 3.2 Merchant List

**Route**: `/admin/merchants`

**Purpose**: Manage all merchants on platform.

**Content**:
- Filter: Tümü | Aktif | Pasif
- Search: by name
- Table:
  | Name | Category | Status | Orders (7d) | Acceptance Rate | Actions |
- Sortable columns
- Pagination

**Actions per row**:
- View detail
- Activate / Deactivate

---

### 3.3 Merchant Detail

**Route**: `/admin/merchants/[id]`

**Purpose**: Full merchant information and performance.

**Content**:
- Merchant info card (name, slug, category, address, phone, owner email)
- Status: Active/Inactive with toggle
- Performance metrics:
  - Orders: today / week / month
  - Acceptance rate
  - Average fulfillment time
  - Courier count
- Recent orders table (last 20)
- Courier list
- Activity timeline (onboarded, last active, etc.)

**Actions**:
- Edit merchant info
- Deactivate/Reactivate
- View as merchant (impersonate — future)

---

### 3.4 Onboard New Merchant

**Route**: `/admin/merchants/new`

**Purpose**: Create a new merchant account.

**Content**:
- Form:
  - Merchant name (required)
  - Slug (auto-generated from name, editable)
  - Category (dropdown: grocery, water, gas)
  - Address (required)
  - Phone (required)
  - Owner email (required)
  - Owner full name (required)
- "Mağaza Oluştur" button

**On success**:
- Merchant record created
- Owner auth account created
- Invitation email sent
- Redirect to merchant detail page

---

### 3.5 All Orders

**Route**: `/admin/orders`

**Purpose**: Cross-merchant order oversight.

**Content**:
- Filters:
  - Status (multi-select)
  - Merchant (dropdown)
  - Date range
  - Customer search
- Table:
  | ID | Merchant | Customer | Status | Total | Created | Actions |
- Sortable columns
- Pagination (50 per page)

**Actions per row**:
- View detail
- Override status (if not terminal)

---

### 3.6 Order Detail (Admin)

**Route**: `/admin/orders/[id]`

**Purpose**: Full order view with override capability.

**Content**:
- Same as merchant order detail, plus:
  - Merchant info (which merchant this belongs to)
  - Full status log timeline
  - Override button (if not terminal)
  - "İptal Et" button with reason input

---

### 3.7 Order Override Dialog

**Triggered from**: Admin order detail

**Content**:
- Current status display
- New status dropdown (only valid admin overrides)
- Reason textarea (required)
- Warning: "Bu işlem geri alınamaz ve loglanacaktır"
- [İptal] [Onayla] buttons

---

### 3.8 System Health

**Route**: `/admin/system`

**Purpose**: Technical health monitoring.

**Content**:
- Service Status:
  - Database: Connected / Error
  - Realtime: Active connections count
  - Edge Functions: Last error (if any)
  - Storage: Usage / limit
- Metrics (last 24h):
  - Total API calls
  - Error rate
  - Average response time
- Alerts log (last 50)
- Cron job status (last timeout check run)

---

### 3.9 Settings

**Route**: `/admin/settings`

**Purpose**: Platform configuration.

**Content**:
- Platform settings:
  - Default order timeout (minutes)
  - Maximum products per merchant
  - Feature flags (toggle list)
- Admin account:
  - Email
  - Password change
  - Logout

---

## 4. UX PRINCIPLES FOR ADMIN

- **Data density**: Show more data per screen (admin is power user)
- **Quick navigation**: Click-through to any entity from any list
- **Audit visibility**: Every action shows who did what when
- **Safe overrides**: Destructive actions require confirmation + reason
- **Cross-reference**: Easy to navigate between merchant ↔ orders ↔ couriers

---

## 5. RESPONSIVE BEHAVIOR

| Viewport | Layout |
|---|---|
| > 1200px | Full sidebar + content |
| 1024-1200px | Collapsible sidebar + content |
| < 1024px | Hamburger menu + full-width content |

Admin panel is functional on tablet but not optimized for phone.
