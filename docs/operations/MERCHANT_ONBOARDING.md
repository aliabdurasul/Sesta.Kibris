# MERCHANT ONBOARDING

## How Merchants Join the Platform

---

## 1. OVERVIEW

Merchant onboarding is admin-controlled in Phase 1. Quality over quantity — every merchant must be vetted before going live.

---

## 2. ONBOARDING FLOW

### Phase 1 (Admin-Driven)

```
1. Sales conversation (in person or WhatsApp)
       │
       ▼
2. Admin creates merchant account in admin panel
       │
       ▼
3. Admin enters products (or assists merchant)
       │
       ▼
4. Merchant receives login credentials (email)
       │
       ▼
5. Merchant logs in, explores dashboard
       │
       ▼
6. Merchant adds/verifies products
       │
       ▼
7. Merchant creates courier(s)
       │
       ▼
8. Admin activates merchant (is_active = true)
       │
       ▼
9. Test order placed and completed
       │
       ▼
10. Merchant goes live for customers
```

### Phase 2 (Self-Service with Approval)

```
1. Merchant visits registration page
       │
       ▼
2. Fills registration form (name, category, address, email)
       │
       ▼
3. Email verification
       │
       ▼
4. Store setup wizard (guided product entry)
       │
       ▼
5. Enters in review queue (status: pending_approval)
       │
       ▼
6. Admin reviews and approves/rejects
       │
       ▼
7. If approved → merchant activated
```

---

## 3. ADMIN ONBOARDING CHECKLIST

Before activating a merchant, admin verifies:

- [ ] Merchant name is correct and professional
- [ ] Slug is clean and URL-friendly
- [ ] Category is correctly assigned
- [ ] Address is accurate
- [ ] Phone number works (tested)
- [ ] Owner has logged in successfully
- [ ] At least 5 products entered with correct prices
- [ ] At least 1 courier created and logged in
- [ ] Product images added (desirable, not required)
- [ ] Test order placed and completed successfully
- [ ] Merchant understands order acceptance flow
- [ ] Push notifications enabled on merchant's device

---

## 4. MERCHANT TRAINING

### What Merchant Must Understand

| Topic | How Taught |
|---|---|
| Accepting orders | Live demo during onboarding |
| Rejecting orders | Shown, with emphasis on reason requirement |
| Managing catalog | Guided by admin on first 5 products |
| Assigning couriers | Demonstrated with test order |
| Opening/closing store | Shown in settings |
| Push notifications | Setup together during onboarding |
| What happens when they don't respond | Explained: timeout, alerts |

### Training Materials (Phase 2)

- Short video walkthrough (Turkish, < 3 minutes)
- PDF one-pager with screenshot guide
- WhatsApp support group for merchants

### Phase 1 Approach

No formal training materials. Admin onboards in person (or video call), walks through the system, places a test order together.

---

## 5. DATA ENTRY DURING ONBOARDING

### Products

Admin enters initial products based on:
- Physical store visit (photograph shelf labels)
- Merchant provides price list (paper or WhatsApp photo)
- Phone call where merchant dictates products

### Product Entry Template

| Info Needed | Source |
|---|---|
| Product name | Merchant (Turkish name as sold) |
| Price | Merchant (verified current price) |
| Unit | Derived from product type |
| Description | Optional, admin writes if helpful |
| Image | Photograph during visit (Phase 1: optional) |
| Stock | Most items: unlimited (NULL) |

### Typical Catalog Sizes

| Merchant Type | Typical Products |
|---|---|
| Grocery | 30-100 products |
| Water delivery | 3-8 products |
| Gas/tube | 2-5 products |

---

## 6. GO-LIVE CHECKLIST

Before telling customers about this merchant:

- [ ] All products have correct prices
- [ ] Store open/closed toggle works
- [ ] Merchant received and accepted a test order
- [ ] Courier received and completed a test delivery
- [ ] Push notifications confirmed working
- [ ] Merchant's phone number is linked (for customer calls)
- [ ] Merchant URL works: `/[merchant-slug]`
- [ ] Merchant committed to responding within timeout window

---

## 7. POST-LAUNCH SUPPORT

### First Week

- Daily check-in with merchant (WhatsApp message)
- Monitor their order acceptance rate
- Address any confusion immediately
- Collect feedback on pain points

### First Month

- Weekly check-in
- Review metrics: response time, rejection rate
- Gather feature requests
- Confirm merchant would recommend to others

### Ongoing

- Support via WhatsApp group or direct message
- Admin monitoring for timeout patterns
- Quarterly business review (Phase 2)

---

## 8. DEACTIVATION CRITERIA

A merchant may be deactivated if:

| Trigger | Action |
|---|---|
| No response to orders for 3+ days | Admin contacts, then deactivates |
| Rejection rate > 50% for 2 weeks | Admin investigates, may deactivate |
| Merchant requests deactivation | Immediate |
| Consistent customer complaints | Admin investigates |
| Fraudulent behavior | Immediate deactivation |

Deactivated merchants:
- Store becomes invisible to customers
- Existing in-progress orders must be resolved first
- Merchant data retained (not deleted)
- Can be reactivated by admin

---

## 9. SCALING ONBOARDING

| Phase | Merchants/Month | Approach |
|---|---|---|
| Phase 1 | 1-3 | Fully manual, high-touch |
| Phase 2 | 5-15 | Self-service + approval queue |
| Phase 3+ | 20+ | Automated onboarding, spot-check QA |
