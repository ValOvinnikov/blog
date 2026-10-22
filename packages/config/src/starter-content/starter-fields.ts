import type { ArticleText, Link } from '@blog/config/sanity/generated/types';

import { LINK_TYPE, type TLocaleIsoCode } from '@blog/config/constants';

import type { TStarterDocument } from './starter-document';

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

export function localizedArticleText(
  locale: TLocaleIsoCode,
  texts: readonly string[],
) {
  return [
    {
      _key: locale,
      _type: 'internationalizedArrayArticleTextValue',
      language: locale,
      value: paragraphs(texts),
    } as const,
  ];
}

export function paragraphs(texts: readonly string[]): ArticleText {
  return texts.map((text, index) => ({
    _type: 'block',
    _key: `paragraph${index}`,
    markDefs: [],
    children: [{ _type: 'span', _key: `span${index}`, text, marks: [] }],
  }));
}

export function internalLink(
  id: string,
  title: string,
  locale: TLocaleIsoCode,
  targetId: string,
): TStarterDocument<Link, 'title' | 'label' | 'linkType'> {
  return {
    _id: id,
    _type: 'link',
    title,
    label: localizedString(locale, title),
    linkType: LINK_TYPE.INTERNAL,
    internalReference: reference(targetId),
  };
}
