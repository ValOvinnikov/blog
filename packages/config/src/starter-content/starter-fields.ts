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
>(valueType: TValueType, locale: TLocaleIsoCode, texts: readonly string[]) {
  return [
    {
      _key: locale,
      _type: valueType,
      language: locale,
      value: paragraphs(texts),
    },
  ];
}

export function localizedArticleText(
  locale: TLocaleIsoCode,
  texts: readonly string[],
) {
  return localizedBlocks(
    'internationalizedArrayArticleTextValue',
    locale,
    texts,
  );
}

export function localizedListedText(
  locale: TLocaleIsoCode,
  texts: readonly string[],
) {
  return localizedBlocks(
    'internationalizedArrayListedTextValue',
    locale,
    texts,
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
