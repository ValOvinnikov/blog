import type { TLocaleIsoCode } from '@shinefold/config/constants';

import { localizedHeadingText } from './starter-portable-text';

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

function keyedReference(id: string) {
  return { _key: id, ...reference(id) };
}

export function moduleItemDocuments<TItem, TDocument extends { _id: string }>(
  id: string,
  idSuffix: string,
  items: readonly TItem[],
  toDocument: (item: TItem, itemId: string, index: number) => TDocument,
) {
  const documents = items.map((item, index) =>
    toDocument(item, `${id}${idSuffix}${index + 1}`, index),
  );
  return {
    documents,
    references: documents.map(({ _id }) => keyedReference(_id)),
  };
}

export function moduleSlot<TModuleType extends string>(
  id: string,
  moduleType: TModuleType,
) {
  return { _key: id, _type: moduleType, _ref: id };
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
    heading: localizedHeadingText(locale, heading),
    ...(supportingText && {
      supportingText: localizedText(locale, supportingText),
    }),
  } as const;
}
