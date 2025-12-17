import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const defaultCountry = process.env.DEFAULT_COUNTRY_ISO || 'BR';
  const parsed = parsePhoneNumberFromString(raw, defaultCountry as any);
  if (parsed && parsed.isValid()) {
    return parsed.number; // E.164
  }
  return null;
}
