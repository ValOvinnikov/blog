import type { InferResultType } from 'groqd';

import type { translationMapQuery } from './query';
import type {
  TTranslationEntry,
  TTranslationGroup,
  TTranslationMap,
} from './types';

export type TRawTranslationMap = InferResultType<typeof translationMapQuery>;

export function toTranslationMap(raw: TRawTranslationMap): TTranslationMap {
  return {
    groups: raw.map(({ entries }) =>
      (entries ?? []).flatMap(({ documentType, language, slug }) =>
        language && slug ? [{ documentType, language, slug }] : [],
      ),
    ),
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
