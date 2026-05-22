export function getCategoryTypeLabel(category?: string): string {
  switch (category) {
    case "water":
      return "Su";
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
