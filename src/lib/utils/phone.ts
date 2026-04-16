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

/**
 * Canonical storage form for a phone number.
 *
 * Why this exists
 * ───────────────
 * Users paste / import phones in many formats: `050-1234567`, `050 123 4567`,
 * `+972-50-123-4567`, `972501234567`, `0501234567`, Excel-formatted numbers
 * that come back as JS numbers without leading zeros, etc.
 *
 * The `users.phone` column has a UNIQUE constraint. Storing the same person
 * as `+972501234567` once and `0501234567` another time silently creates
 * two user rows, and then imports keep "finding" the wrong row by global
 * phone lookup — this is the root cause of the bulk-import duplication bugs.
 *
 * This function returns a stable, always-E.164-ish canonical form:
 *   - Strips every character that is not a digit.
 *   - Restores the leading `+`.
 *   - Israeli mobile / landline numbers (`0XXXXXXXXX` or `972XXXXXXXXX`)
 *     are normalised to `+972XXXXXXXXX`.
 *   - Other numbers keep their country code and get a `+` prefix.
 *   - Returns `null` when the result is too short to be a real phone
 *     (<9 digits after cleanup) — import code treats this as "invalid".
 */
export function normalizePhoneForStorage(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;

  // Excel can hand us a number (e.g. 972501234567) or a string; coerce safely
  // and strip EVERY non-digit so formatting characters never leak into storage.
  const str = String(raw).trim();
  if (!str) return null;

  const digitsOnly = str.replace(/\D/g, "");
  if (!digitsOnly) return null;

  // Israeli local form: 0XXXXXXXXX (9–10 digits total starting with 0) → +972…
  if (digitsOnly.startsWith("0") && digitsOnly.length >= 9 && digitsOnly.length <= 11) {
    return `+972${digitsOnly.slice(1)}`;
  }

  // Israeli international without the leading `+`: 972XXXXXXXXX.
  if (digitsOnly.startsWith("972") && digitsOnly.length >= 11 && digitsOnly.length <= 13) {
    return `+${digitsOnly}`;
  }

  // Any other number with a plausible country code — anything under 9 digits is junk.
  if (digitsOnly.length < 9) return null;

  return `+${digitsOnly}`;
}

/**
 * Returns every phone-string variant that should be treated as the same
 * number during lookups. We need this because historical user rows may have
 * been saved with whatever formatting the sign-up / import path used at
 * the time, so a single `WHERE phone = canonical` is not enough to catch
 * duplicates that predate `normalizePhoneForStorage`.
 *
 * Example — given `050-1234567` this returns:
 *   ["+972501234567", "972501234567", "0501234567", "501234567"]
 *
 * Caller uses this with `inArray(users.phone, candidates)` so the DB can
 * still hit the unique index.
 */
export function phoneLookupCandidates(raw: unknown): string[] {
  const canonical = normalizePhoneForStorage(raw);
  if (!canonical) return [];

  const digits = canonical.replace(/\D/g, "");
  const variants = new Set<string>();
  variants.add(canonical); // +972501234567
  variants.add(digits); // 972501234567

  // Israeli number: also check the local `0…` form and the bare national form.
  if (digits.startsWith("972")) {
    const national = digits.slice(3); // 501234567
    variants.add(national);
    variants.add(`0${national}`); // 0501234567
  }

  // If someone passed in a raw digit string, include it verbatim too.
  if (typeof raw === "string") {
    const asIs = raw.trim();
    if (asIs) variants.add(asIs);
  }

  return Array.from(variants);
}
