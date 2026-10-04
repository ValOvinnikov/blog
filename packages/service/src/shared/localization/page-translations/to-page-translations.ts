import type { TLocaleIsoCode } from '@blog/config/constants';
import type { InferResultType } from 'groqd';

import type { translationsQuery } from './translations';

export type TRawPageTranslations = InferResultType<typeof translationsQuery>;

export type TPageTranslation = { language: TLocaleIsoCode; slug: string };

export function toPageTranslations(
  translations: TRawPageTranslations | null,
): TPageTranslation[] {
  return (translations ?? []).flatMap(({ language, slug }) =>
    language && slug ? [{ language, slug }] : [],
  );
}
