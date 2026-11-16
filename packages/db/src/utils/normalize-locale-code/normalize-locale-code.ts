import {
  isLocaleIsoCode,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';

export function normalizeLocaleCode(locale: string): TLocaleIsoCode {
  const code = locale.trim().toUpperCase();

  if (!isLocaleIsoCode(code)) {
    throw new Error(
      `normalizeLocaleCode: "${locale}" is not a supported language.`,
    );
  }

  return code;
}
