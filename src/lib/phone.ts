/** Returns the 10-digit North American number, or null if it is not valid. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  const national =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  // NANP: area code and exchange both start with 2-9.
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(national) ? national : null;
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}

/** "7805550123" -> "(780) 555-0123". Unparseable input is returned as is. */
export function formatPhone(input: string): string {
  const national = normalizePhone(input);
  if (!national) return input;
  return `(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}

export function telHref(input: string): string {
  const national = normalizePhone(input);
  return national ? `tel:+1${national}` : `tel:${input.replace(/[^\d+]/g, "")}`;
}

export function smsHref(input: string): string {
  const national = normalizePhone(input);
  return national ? `sms:+1${national}` : `sms:${input.replace(/[^\d+]/g, "")}`;
}
