import type { TLocaleIsoCode } from '@blog/config/constants';
import type { InferResultType } from 'groqd';

import type { homeLanguagesQuery } from './home-languages';

export type TRawHomeLanguages = InferResultType<typeof homeLanguagesQuery>;

export function toHomeLanguages(
  raw: TRawHomeLanguages,
  defaultLocale: TLocaleIsoCode,
): TLocaleIsoCode[] {
  return [...new Set(raw.map(({ language }) => language ?? defaultLocale))];
}
