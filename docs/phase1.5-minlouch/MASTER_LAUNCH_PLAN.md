# 🚀 Sesta Kıbrıs — Full Launch Pack
> **"Kıbrıs'ın Sepeti"** — Master Launch Documentation  
> Version: 1.5.1 | Status: Pre-Launch Planning  
> Owner: Super Admin

---

## Overview

Sesta Kıbrıs is a multi-vendor marketplace platform for Cyprus. This document is the master index for all pre-launch phases. Each phase has its own `.md` file with microtasks ready to implement one by one.

---

## Phase Index

| Phase | File | Topic | Priority |
|-------|------|--------|----------|
| 1 | `PHASE_1.6_BRANDING.md` | Min Branding Before Launch | 🔴 Critical |
| 2 | `PHASE_1.7_ONBOARDING.md` | Onboarding + Market Discovery | 🔴 Critical |
| 3 | `PHASE_1.8_UI_UX.md` | UI/UX — Olmazsa Olmaz | 🔴 Critical |
| 4 | `PHASE_1.9_TELEGRAM.md` | Telegram Bot — Instant Notifications | 🟠 High |
| 5 | `PHASE_1.2.1_STRIPE.md` | Stripe Integration (Test → Production) | 🔴 Critical |
| 6 | `PHASE_1.2.2_ADMIN.md` | Super Admin Control Panel | 🟠 High |

---

## Launch Readiness Checklist

### 🔴 Must-Have Before Any User Sees the App
- [ ] Logo + favicon live
- [ ] Brand colors applied globally
- [ ] App name "Sesta Kıbrıs" consistent everywhere
- [ ] Onboarding screen on first launch
- [ ] Top markets logic working
- [ ] Stripe TEST mode functional end-to-end
- [ ] Telegram bot receiving order + alert notifications

### 🟠 Must-Have Before Public Launch
- [ ] Stripe PRODUCTION live with real payments
- [ ] Admin control panel operational
- [ ] UI/UX minimum polish complete
- [ ] All error states handled gracefully

### 🟢 Nice-to-Have (Post-Launch V1.1)
- [ ] Push notifications (web/mobile)
- [ ] Referral system
- [ ] Analytics dashboard
- [ ] Multi-language (TR/EN/EL)

---

## Numbering Convention

All tasks across all phase files follow this pattern:

```
PHASE.SECTION.TASK
e.g. 4.2.1 = Phase 4 (Telegram), Section 2, Task 1
```

Each task has:
- **What**: What to build/do
- **Where**: File/component/service to touch
- **Done When**: Clear acceptance criteria

---

## Tech Stack Assumptions
> Update these if your stack differs — each phase doc references them.

| Layer | Tech |
|-------|------|
| Frontend | Next.js / React |
| Backend | Node.js / Express or Next.js API routes |
| Database | PostgreSQL or MongoDB |
| Auth | NextAuth / JWT |
| Payments | Stripe |
| Notifications | Telegram Bot API |
| Hosting | Vercel / VPS |
| Storage | S3 / Cloudinary |

---

## How to Use These Docs

1. Open the phase file (e.g. `PHASE_4_TELEGRAM.md`)
2. Work through tasks top to bottom — they are ordered by dependency
3. Check off `[ ]` as you complete each microtask
4. Never skip to the next section until current section tasks are all ✅
5. Use task IDs (e.g. `4.2.1`) when referencing in commits, PRs, or messages

---

*Generated for Sesta Kıbrıs Pre-Launch Sprint*
