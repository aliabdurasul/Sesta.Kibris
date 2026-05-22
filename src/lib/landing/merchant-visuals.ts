export function getStoreThumbnailClass(category?: string): string {
  switch (category) {
    case "water":
      return "bg-gradient-to-br from-brand-sky/70 to-brand-sky";
    case "gas":
      return "bg-gradient-to-br from-slate-400 to-slate-500";
    case "campus":
      return "bg-gradient-to-br from-brand-navy/80 to-brand-navy";
    case "local":
      return "bg-gradient-to-br from-brand-orange/80 to-brand-orange";
    case "grocery":
    default:
      return "bg-gradient-to-br from-emerald-400/90 to-teal-500/90";
  }
}

export function getCategoryTypeLabel(category?: string): string {
  switch (category) {
    case "water":
      return "Su & İçecek";
    case "gas":
      return "Tüp";
    case "campus":
      return "Kampüs";
    case "local":
      return "Yerel";
    case "grocery":
    default:
      return "Market";
  }
}

export function getDeliveryEta(category?: string): string {
  switch (category) {
    case "water":
      return "12 dk";
    case "gas":
      return "25 dk";
    case "campus":
      return "18 dk";
    default:
      return "15–20 dk";
  }
}
