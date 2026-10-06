import type { TLocaleIsoCode } from '@blog/config/constants';
import { toPageLanguages } from '@blog/service/shared/localization/page-languages/to-page-languages';
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
    homeLanguages: toPageLanguages(raw.homes, defaultLocale),
    postIndexLanguages: toPageLanguages(raw.postIndexes, defaultLocale),
    topicIndexLanguages: toPageLanguages(raw.topicIndexes, defaultLocale),
    tagIndexLanguages: toPageLanguages(raw.tagIndexes, defaultLocale),
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
