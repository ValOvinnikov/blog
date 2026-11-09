import type { TLocaleIsoCode } from '@blog/config/constants';

export const templateIdFor = (name: string, locale: TLocaleIsoCode) =>
  `${name}-${locale}`;
