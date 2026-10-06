import {
  LOCALE_BCP47_TAGS,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@blog/config';

type TWeightedLanguage = { primaryTag: string; quality: number };

const toWeightedLanguage = (
  part: string,
): TMaybeUndefined<TWeightedLanguage> => {
  const [range = '', ...parameters] = part.trim().split(';');
  const primaryTag = range.trim().split('-')[0]?.toLowerCase() ?? '';
  const qualityParameter = parameters
    .map((parameter) => parameter.trim())
    .find((parameter) => parameter.startsWith('q='));
  const quality = qualityParameter ? Number(qualityParameter.slice(2)) : 1;

  if (!primaryTag || primaryTag === '*' || !(quality > 0)) {
    return undefined;
  }
  return { primaryTag, quality };
};

export const matchAcceptLanguage = (
  header: string | null,
  liveLocales: readonly TLocaleIsoCode[],
): TMaybeUndefined<TLocaleIsoCode> => {
  const preferences = (header ?? '')
    .split(',')
    .flatMap((part) => toWeightedLanguage(part) ?? [])
    .sort((a, b) => b.quality - a.quality);

  for (const { primaryTag } of preferences) {
    const match = liveLocales.find(
      (locale) => LOCALE_BCP47_TAGS[locale] === primaryTag,
    );
    if (match) {
      return match;
    }
  }
  return undefined;
};
