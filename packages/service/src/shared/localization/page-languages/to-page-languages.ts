import type { TLocaleIsoCode } from '@blog/config/constants';
import type { InferResultType } from 'groqd';

import type { pageLanguagesQuery } from './page-languages';

export type TRawPageLanguages = InferResultType<
  ReturnType<typeof pageLanguagesQuery>
>;

export function toPageLanguages(
  raw: TRawPageLanguages,
  defaultLocale: TLocaleIsoCode,
): TLocaleIsoCode[] {
  return [...new Set(raw.map(({ language }) => language ?? defaultLocale))];
}
