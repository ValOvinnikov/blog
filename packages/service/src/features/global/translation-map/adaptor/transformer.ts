import type { TLocaleIsoCode } from '@blog/config/constants';
import { toHomeLanguages } from '@blog/service/shared/localization/home-languages/to-home-languages';
import type { InferResultType } from 'groqd';

import type { translationMapQuery } from './query';
import type {
  TTranslationEntry,
  TTranslationGroup,
  TTranslationMap,
} from './types';

export type TRawTranslationMap = InferResultType<typeof translationMapQuery>;

export function toTranslationMap(
  raw: TRawTranslationMap,
  defaultLocale: TLocaleIsoCode,
): TTranslationMap {
  return {
    groups: raw.groups.map(({ entries }) =>
      (entries ?? []).flatMap(({ documentType, language, slug }) =>
        language && slug ? [{ documentType, language, slug }] : [],
      ),
    ),
    homeLanguages: toHomeLanguages(raw.homes, defaultLocale),
  };
}

export function findTranslationGroup(
  map: TTranslationMap,
  member: TTranslationEntry,
): TTranslationGroup | undefined {
  return map.groups.find((group) =>
    group.some(
      (entry) =>
        entry.documentType === member.documentType &&
        entry.language === member.language &&
        entry.slug === member.slug,
    ),
  );
}
