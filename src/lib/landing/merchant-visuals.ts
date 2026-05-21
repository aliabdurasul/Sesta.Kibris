export function getStoreThumbnailClass(category?: string): string {
  switch (category) {
    case "water":
      return "bg-gradient-to-br from-brand-sky/80 to-brand-navy/70";
    case "gas":
      return "bg-gradient-to-br from-slate-400 to-slate-600";
    case "campus":
      return "bg-gradient-to-br from-brand-navy to-indigo-900";
    case "local":
      return "bg-gradient-to-br from-amber-400 to-brand-orange";
    case "grocery":
    default:
      return "bg-gradient-to-br from-brand-orange/90 to-amber-500";
  }
}

export function getCategoryTypeLabel(category?: string): string {
  switch (category) {
    case "water":
      return "Su & içecek";
    case "gas":
      return "Tüp gaz";
    case "campus":
      return "Kampüs";
    case "local":
      return "Yerel dükkan";
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
