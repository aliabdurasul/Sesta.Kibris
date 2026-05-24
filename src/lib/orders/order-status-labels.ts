export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Sipariş Alındı",
  CONFIRMED: "Hazırlanıyor",
  READY: "Hazır — Kurye Bekleniyor",
  ASSIGNED: "Kurye Atandı",
  PICKED_UP: "Alındı",
  IN_TRANSIT: "Yolda",
  DELIVERED: "Teslim Edildi",
  REJECTED: "Reddedildi",
  FAILED_DELIVERY: "Teslim Edilemedi",
  CANCELLED: "İptal Edildi",
};

export const ORDER_STATUS_ICONS: Record<string, string> = {
  PENDING: "🕐",
  CONFIRMED: "👨‍🍳",
  READY: "✅",
  ASSIGNED: "🛵",
  PICKED_UP: "📦",
  IN_TRANSIT: "🚀",
  DELIVERED: "🎉",
  REJECTED: "❌",
  FAILED_DELIVERY: "⚠️",
  CANCELLED: "🚫",
};

export function orderDeliveryEstimate(status: string): string {
  switch (status) {
    case "PENDING":
      return "Market siparişinizi onayladığında hazırlık başlayacak.";
    case "CONFIRMED":
      return "Siparişiniz hazırlanıyor — tahmini 20–40 dk.";
    case "READY":
    case "ASSIGNED":
    case "PICKED_UP":
    case "IN_TRANSIT":
      return "Kurye yolda — tahmini 15–30 dk.";
    case "DELIVERED":
      return "Siparişiniz teslim edildi.";
    case "REJECTED":
    case "CANCELLED":
      return "Sipariş iptal edildi veya reddedildi.";
    case "FAILED_DELIVERY":
      return "Teslimat tamamlanamadı — market sizinle iletişime geçebilir.";
    default:
      return "Durum güncelleniyor…";
  }
}
