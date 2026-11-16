import type { TLocaleIsoCode } from '@shinefold/config/constants';

export const templateIdFor = (name: string, locale: TLocaleIsoCode) =>
  `${name}-${locale}`;
