/**
 * Normalizes a phone number for use in tel: and WhatsApp links.
 * Strips formatting, ensures +972 prefix for Israeli numbers.
 */
export function normalizePhoneForLink(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("0") && cleaned.length >= 9 && cleaned.length <= 11) {
    return `+972${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith("+")) return cleaned;
  return `+${cleaned}`;
}

export function telLink(phone: string): string {
  return `tel:${normalizePhoneForLink(phone)}`;
}

export function whatsappLink(phone: string): string {
  const normalized = normalizePhoneForLink(phone);
  return `https://wa.me/${normalized.replace("+", "")}`;
}
