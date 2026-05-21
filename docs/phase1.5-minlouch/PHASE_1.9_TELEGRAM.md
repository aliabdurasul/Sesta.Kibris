# Phase 1.9 — Telegram Bot (Instant Notifications)
> **Sesta Kıbrıs**  
> File: `PHASE_1.9_TELEGRAM.md`  
> Dependency: Backend API routes exist, orders/users in DB

---

## Goal
Zero-friction instant notification system. The Telegram bot is your real-time operations nerve center — new orders, payment confirmations, market alerts, and admin pings. Fast to set up, no app required, works anywhere.

---

## 4.1 — Bot Setup & Configuration

### 4.1.1 — Create the Bot via BotFather
- **What**: Register the Telegram bot
- **Steps**:
  1. Open Telegram → search `@BotFather`
  2. Send `/newbot`
  3. Name: `Sesta Kıbrıs Bildirimler`
  4. Username: `SestaKibrisBot` (or available alternative)
  5. Save the `BOT_TOKEN` securely
- **Done When**: BotFather gives you `7XXXXXXXXX:AAF...` token, bot responds to `/start`

### 4.1.2 — Environment Variables
- **What**: Add to `.env` and `.env.example`

```env
TELEGRAM_BOT_TOKEN=7XXXXXXXXX:AAFxxxxxxxxxxxxxxxxx
TELEGRAM_ADMIN_CHAT_ID=-100XXXXXXXXXX   # Your admin group/channel ID
TELEGRAM_MARKET_GROUP_ID=-100XXXXXXXXXX # Optional: per-market group
```

- **Done When**: Variables in `.env`, referenced in code via `process.env.TELEGRAM_BOT_TOKEN`

### 4.1.3 — Telegram Service Module
- **What**: Centralized service for all Telegram sends
- **Where**: `lib/telegram.ts`

```ts
// lib/telegram.ts
const BASE_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<void> {
  await fetch(`${BASE_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    }),
  })
}

export async function sendTelegramPhoto(
  chatId: string | number,
  photoUrl: string,
  caption: string
): Promise<void> {
  await fetch(`${BASE_URL}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML' }),
  })
}
```

- **Done When**: `sendTelegramMessage(chatId, "test")` sends a message without errors

### 4.1.4 — Get Your Admin Chat ID
- **What**: Find the chat_id of your admin group or personal account
- **Steps**:
  1. Add your bot to the admin Telegram group
  2. Send any message in the group
  3. Visit: `https://api.telegram.org/bot{TOKEN}/getUpdates`
  4. Find `"chat": {"id": -100XXXXXXXXXX}` — that's your `TELEGRAM_ADMIN_CHAT_ID`
- **Done When**: You've confirmed the chat_id and stored it in `.env`

---

## 4.2 — Notification Templates

### 4.2.1 — New Order Alert (Admin)
- **Trigger**: Order placed by any user
- **Where**: `lib/notifications/orderNotifications.ts`

```ts
export function formatNewOrderMessage(order: Order): string {
  return `
🛒 <b>YENİ SİPARİŞ!</b>

📦 Sipariş #${order.id.slice(0, 8).toUpperCase()}
🏪 Market: ${order.marketName}
👤 Müşteri: ${order.customerName}
📍 Adres: ${order.deliveryAddress}

🧾 <b>Ürünler:</b>
${order.items.map(i => `  • ${i.name} x${i.qty} — €${i.price}`).join('\n')}

💰 Toplam: <b>€${order.total}</b>
🚚 Teslimat: €${order.deliveryFee}
⏱ Tahmini: ${order.estimatedMinutes} dk

🔗 <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${order.id}">Admin Paneli →</a>
  `.trim()
}
```

- **Done When**: Placing a test order → admin Telegram gets this exact message

### 4.2.2 — Payment Confirmed Alert
- **Trigger**: Stripe webhook `payment_intent.succeeded`
- **Message**:

```ts
export function formatPaymentConfirmedMessage(order: Order): string {
  return `
✅ <b>ÖDEME ONAYLANDI</b>

💳 Sipariş #${order.id.slice(0, 8).toUpperCase()}
💰 Tutar: €${order.total}
👤 ${order.customerName}
⏰ ${new Date().toLocaleString('tr-TR', { timeZone: 'Asia/Nicosia' })}
  `.trim()
}
```

- **Done When**: Test Stripe payment → Telegram confirmation message received

### 4.2.3 — Order Status Update (to Customer)
- **Trigger**: Market/admin updates order status
- **Statuses**: `preparing` | `on_the_way` | `delivered` | `cancelled`

```ts
const STATUS_MESSAGES = {
  preparing:   '👨‍🍳 Siparişiniz hazırlanıyor!',
  on_the_way:  '🛵 Siparişiniz yolda!',
  delivered:   '✅ Siparişiniz teslim edildi! Afiyet olsun 🙏',
  cancelled:   '❌ Siparişiniz iptal edildi. Üzgünüz.',
}
```

- **Note**: Customer must have opted in / shared their Telegram chat_id during registration
- **Done When**: Status change in admin panel → customer gets Telegram message

### 4.2.4 — New Market Registration Alert
- **Trigger**: New market submits registration form
- **Message**:

```ts
export function formatNewMarketMessage(market: MarketRegistration): string {
  return `
🏪 <b>YENİ MARKET BAŞVURUSU</b>

📛 ${market.name}
📧 ${market.email}
📞 ${market.phone}
📍 ${market.city}, ${market.address}

🔗 <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/markets/review/${market.id}">İncele →</a>
  `.trim()
}
```

- **Done When**: Market form submission → admin Telegram gets alert

### 4.2.5 — Low Stock Alert (Market Owner)
- **Trigger**: Product stock drops below threshold
- **Message**: `⚠️ Stok Uyarısı: "{productName}" ürününde yalnızca {qty} adet kaldı!`
- **Done When**: Stock update below threshold → relevant market's chat gets message

### 4.2.6 — Daily Summary Report (Scheduled)
- **Trigger**: Cron job, every day at 23:00 Cyprus time
- **Message**:

```ts
export function formatDailySummary(stats: DailyStats): string {
  return `
📊 <b>GÜNLÜK RAPOR — ${new Date().toLocaleDateString('tr-TR')}</b>

📦 Sipariş Sayısı: ${stats.totalOrders}
💰 Toplam Ciro: €${stats.totalRevenue}
👤 Yeni Kullanıcı: ${stats.newUsers}
🏪 Aktif Market: ${stats.activeMarkets}
❌ İptal: ${stats.cancelledOrders}

📈 Dünden fark: ${stats.revenueChange > 0 ? '▲' : '▼'} %${Math.abs(stats.revenueChange)}
  `.trim()
}
```

- **Done When**: Cron fires at 23:00 → daily summary appears in admin Telegram

---

## 4.3 — Webhook Setup (Receiving Commands)

### 4.3.1 — Set Webhook
- **What**: Tell Telegram to POST updates to your server
- **Where**: `app/api/telegram/webhook/route.ts`

```ts
// Set webhook (run once)
fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook`, {
  method: 'POST',
  body: JSON.stringify({ url: `${APP_URL}/api/telegram/webhook` }),
  headers: { 'Content-Type': 'application/json' }
})
```

- **Done When**: BotFather shows webhook as set, updates arrive at your endpoint

### 4.3.2 — Admin Bot Commands
- **What**: Bot responds to commands from admin chat

```
/status          → System health (DB, Stripe, uptime)
/today           → Today's orders & revenue
/orders          → Last 10 orders
/pause           → Pause new orders (maintenance mode)
/resume          → Resume orders
/help            → List all commands
```

- **Where**: `app/api/telegram/webhook/route.ts` — parse `message.text` and route

```ts
const commandHandlers: Record<string, () => Promise<string>> = {
  '/status': getSystemStatus,
  '/today': getTodayStats,
  '/orders': getRecentOrders,
  '/pause': pauseOrders,
  '/resume': resumeOrders,
  '/help': getHelpText,
}
```

- **Done When**: Sending `/today` to bot returns real data from DB

### 4.3.3 — Security: Admin-Only Commands
- **What**: Only whitelisted chat_ids can run commands
- **Where**: Webhook handler

```ts
const ALLOWED_CHAT_IDS = [process.env.TELEGRAM_ADMIN_CHAT_ID]

if (!ALLOWED_CHAT_IDS.includes(String(update.message.chat.id))) {
  return sendTelegramMessage(chatId, '⛔ Bu komutu kullanma yetkiniz yok.')
}
```

- **Done When**: Sending `/today` from an unauthorized account → gets rejection message

---

## 4.4 — Customer Opt-In Flow

### 4.4.1 — Telegram Link in Registration
- **What**: During signup, optional field: *"Telegram bildirimleri almak ister misiniz?"*
- **Flow**: User taps → opens `t.me/SestaKibrisBot?start=user_{userId}` → bot saves their chat_id
- **Where**: `app/api/telegram/webhook/route.ts` → handle `/start user_{userId}` command

```ts
if (text.startsWith('/start user_')) {
  const userId = text.replace('/start user_', '')
  await db.user.update({ where: { id: userId }, data: { telegramChatId: chatId } })
  await sendTelegramMessage(chatId, '✅ Bildirimler aktif! Siparişlerinizi buradan takip edebilirsiniz.')
}
```

- **Done When**: User taps link, starts bot → their `telegramChatId` saved in DB

### 4.4.2 — Opt-Out Command
- **What**: User sends `/dur` or `/stop` to unsubscribe
- **Done When**: Command clears `telegramChatId` from user record

---

## 4.5 — Delivery: Telegram Checklist

```
[ ] 4.1.1 — Bot created via BotFather, token saved
[ ] 4.1.2 — Env variables configured
[ ] 4.1.3 — Telegram service module (sendTelegramMessage)
[ ] 4.1.4 — Admin chat_id confirmed and in .env
[ ] 4.2.1 — New order alert fires to admin
[ ] 4.2.2 — Payment confirmed alert (from Stripe webhook)
[ ] 4.2.3 — Order status updates to customer
[ ] 4.2.4 — New market registration alert
[ ] 4.2.5 — Low stock alert to market owner
[ ] 4.2.6 — Daily summary cron (23:00 Cyprus time)
[ ] 4.3.1 — Webhook URL set and receiving updates
[ ] 4.3.2 — Admin commands: /status /today /orders /pause /resume
[ ] 4.3.3 — Command security (whitelist check)
[ ] 4.4.1 — Customer opt-in flow via /start deep link
[ ] 4.4.2 — /dur opt-out command
```

