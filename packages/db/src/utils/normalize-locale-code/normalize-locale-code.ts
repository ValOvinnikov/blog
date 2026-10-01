import type { TLocaleIsoCode } from '@blog/config/constants';

export function normalizeLocaleCode(locale: string): TLocaleIsoCode {
  return locale.trim().toUpperCase();
}
