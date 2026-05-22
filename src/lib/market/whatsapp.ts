/** Build https://wa.me/ link from user-entered phone (TR/KKTC friendly). */
export function normalizeWhatsAppDigits(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0") && digits.length >= 10) {
    digits = `90${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith("5")) {
    digits = `90${digits}`;
  }

  return digits.length >= 10 ? digits : null;
}

export function buildWhatsAppUrl(phone: string): string | null {
  const digits = normalizeWhatsAppDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function formatWhatsAppDisplay(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = normalizeWhatsAppDigits(trimmed);
  if (!digits) return trimmed;
  if (digits.startsWith("90") && digits.length === 12) {
    return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return `+${digits}`;
}
