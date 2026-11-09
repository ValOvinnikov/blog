import type { ArticleText } from '@blog/config/sanity/generated/types';

import type { TLocaleIsoCode } from '@blog/config/constants';

export function seo(metaTitle: string, metaDescription: string) {
  return {
    _type: 'seo',
    metaTitle,
    metaDescription,
    openGraph: {
      _type: 'openGraph',
      ogTitle: metaTitle,
      ogDescription: metaDescription,
    },
  } as const;
}

export function reference(id: string) {
  return { _type: 'reference', _ref: id } as const;
}

export function keyedReference(id: string) {
  return { _key: id, ...reference(id) };
}

function localized<
  TValueType extends
    'internationalizedArrayStringValue' | 'internationalizedArrayTextValue',
>(valueType: TValueType, locale: TLocaleIsoCode, value: string) {
  return [{ _key: locale, _type: valueType, language: locale, value }];
}

export function localizedString(locale: TLocaleIsoCode, value: string) {
  return localized('internationalizedArrayStringValue', locale, value);
}

export function localizedText(locale: TLocaleIsoCode, value: string) {
  return localized('internationalizedArrayTextValue', locale, value);
}

export function pageHeadingBlock(heading: string, supportingText: string) {
  return { _type: 'pageHeadingBlock', heading, supportingText } as const;
}

export function slug(current: string) {
  return { _type: 'slug', current } as const;
}

export function moduleHeadingBlock(
  locale: TLocaleIsoCode,
  heading: string,
  supportingText?: string,
) {
  return {
    _type: 'moduleHeadingBlock',
    heading: localizedString(locale, heading),
    ...(supportingText && {
      supportingText: localizedText(locale, supportingText),
    }),
  } as const;
}

function localizedBlocks<
  TValueType extends
    | 'internationalizedArrayArticleTextValue'
    | 'internationalizedArrayListedTextValue',
  TBlock,
>(valueType: TValueType, locale: TLocaleIsoCode, value: TBlock[]) {
  return [{ _key: locale, _type: valueType, language: locale, value }];
}

export function localizedArticleBlocks(
  locale: TLocaleIsoCode,
  blocks: ArticleText,
) {
  return localizedBlocks(
    'internationalizedArrayArticleTextValue',
    locale,
    blocks,
  );
}

export function localizedListedText(
  locale: TLocaleIsoCode,
  texts: readonly string[],
) {
  return localizedBlocks(
    'internationalizedArrayListedTextValue',
    locale,
    paragraphs(texts),
  );
}

export function paragraphs(texts: readonly string[]) {
  return texts.map((text, index) => ({
    _type: 'block' as const,
    _key: `paragraph${index}`,
    markDefs: [],
    children: [
      { _type: 'span' as const, _key: `span${index}`, text, marks: [] },
    ],
  }));
}
