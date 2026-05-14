# PRODUCT CATALOG

## Product and Inventory Management

---

## 1. OVERVIEW

The Product Catalog is merchant-owned and customer-visible. Merchants manage their products; customers browse them. Products are the building blocks of orders.

---

## 2. PRODUCT STRUCTURE

### Fields

| Field | Required | Description |
|---|---|---|
| name | Yes | Product display name (Turkish) |
| price | Yes | Price in kuruş (integer), must be > 0 |
| unit | Yes | Measurement unit (e.g., "19L", "kg", "adet", "paket") |
| description | No | Optional description or details |
| image_url | No | Product photo (Supabase Storage) |
| stock_count | No | NULL = unlimited, integer = limited |
| is_available | Yes | Toggle without deleting |
| display_order | Yes | Sort position in catalog |

### Category Examples

| Merchant Type | Example Products | Typical Units |
|---|---|---|
| Grocery | Süt, Ekmek, Yumurta, Pirinç | litre, adet, 10'lu, kg |
| Water | 19L Damacana, 5L Su, 1.5L Pet | 19L, 5L, 1.5L |
| Gas | Tüp (12kg), Tüp (27kg) | 12kg, 27kg |

---

## 3. CATALOG OPERATIONS

### Add Product

1. Merchant fills form: name, price, unit, description (optional)
2. Optionally uploads image
3. Product created with `is_available = true`
4. Appears in customer-facing catalog immediately

### Edit Product

- Merchant can edit: name, price, unit, description, image, stock_count, display_order
- Price changes take effect immediately for NEW orders
- Existing orders retain snapshotted price (immutable)
- No version history for products in Phase 1

### Remove Product

- Soft delete: set `is_available = false`
- Product disappears from customer catalog
- Product still visible in historical orders (via snapshot)
- Hard delete is never performed

### Reorder Products

- Merchant sets `display_order` (integer)
- Lower number = appears first
- Drag-and-drop UI in merchant dashboard
- Customers see products in this order

---

## 4. IMAGE HANDLING

### Upload

- Max file size: 5MB
- Accepted formats: JPEG, PNG, WebP
- Stored in Supabase Storage bucket: `product-images`
- Path: `{merchant_id}/{product_id}.{ext}`

### Display

- Thumbnail: 200x200px (generated on upload or lazy)
- Full size: max 800px width
- Fallback: generic placeholder per merchant category
- CDN-cached via Supabase Storage + Vercel CDN

### Constraints

- One image per product (Phase 1)
- Multiple images per product (Phase 2)
- No video

---

## 5. PRICING RULES

### Format

- Stored as integer in kuruş (1 TL = 100 kuruş)
- Example: 150.00 TL stored as `15000`
- Display: formatted as "₺150,00" in Turkish locale
- No fractional kuruş (always whole numbers)

### Price Display

| Context | Format |
|---|---|
| Product card | "₺150,00" |
| Cart item | "₺150,00 × 2 = ₺300,00" |
| Order total | "Toplam: ₺300,00" |
| API response | `15000` (integer, kuruş) |

### Price Change Behavior

- Merchant changes price → immediate effect on catalog
- Orders already placed → unaffected (snapshotted)
- Cart items → recalculated at order submission (server-side)
- Customer sees updated price if they refresh catalog

---

## 6. STOCK MANAGEMENT

### Phase 1 (Simple)

| `stock_count` Value | Meaning | Customer Sees |
|---|---|---|
| `NULL` | Unlimited stock | Product available |
| `> 0` | Limited stock | Product available |
| `0` | Out of stock | "Stokta yok" badge, cannot add to cart |

### Stock Decrement (Phase 2)

- On order CONFIRMED: decrement stock by ordered quantity
- On order CANCELLED: increment stock back
- On order REJECTED: increment stock back
- Phase 1: stock is informational only, not auto-decremented

### Low Stock Alert (Phase 2)

- Warning to merchant when stock_count ≤ 5
- Configurable threshold per product

---

## 7. CATALOG VISIBILITY

### Public Visibility (Customer)

- Only products where `is_available = true`
- Only from merchants where `is_active = true`
- Sorted by `display_order` ASC
- Includes: name, price, unit, description, image, stock status

### Merchant Visibility

- All products (including unavailable)
- Includes all fields + edit capabilities
- Unavailable products shown with visual indicator

---

## 8. SEARCH AND FILTERING

### Phase 1

- No search functionality
- Products displayed as a flat list per merchant
- Merchant catalog is typically small (10-50 products)

### Phase 2

- Text search within merchant's catalog
- Category/tag filtering (if merchant categorizes products)
- Customer can search across merchants (marketplace search)

---

## 9. BULK OPERATIONS (Phase 2)

| Operation | Description |
|---|---|
| CSV import | Merchant uploads product list |
| Bulk price update | Apply percentage increase to all products |
| Bulk availability toggle | Close all products (vacation mode) |

---

## 10. DATA INTEGRITY

| Rule | Enforcement |
|---|---|
| Price must be > 0 | Database CHECK constraint |
| Name cannot be empty | NOT NULL constraint |
| Unit cannot be empty | NOT NULL constraint |
| Product belongs to one merchant | FK + RLS |
| Deleted products persist in order history | Snapshot design |
| Image path is valid | Application validation on upload |
