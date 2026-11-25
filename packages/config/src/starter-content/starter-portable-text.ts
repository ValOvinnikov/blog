import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { ArticleText } from '@shinefold/config/sanity/generated/types';

function localizedBlocks<
  TValueType extends
    | 'internationalizedArrayArticleTextValue'
    | 'internationalizedArrayHeadingTextValue'
    | 'internationalizedArrayListedTextValue'
    | 'internationalizedArrayParagraphTextValue',
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

export function localizedHeadingText(locale: TLocaleIsoCode, text: string) {
  return localizedBlocks('internationalizedArrayHeadingTextValue', locale, [
    {
      _type: 'block' as const,
      _key: 'heading',
      children: [plainSpan(text, 0)],
    },
  ]);
}

export function localizedParagraphText(locale: TLocaleIsoCode, text: string) {
  return localizedBlocks(
    'internationalizedArrayParagraphTextValue',
    locale,
    paragraphs([text]),
  );
}

function plainSpan(text: string, index: number) {
  return { _type: 'span' as const, _key: `span${index}`, text, marks: [] };
}

export function paragraphs(texts: readonly string[]) {
  return texts.map((text, index) => ({
    _type: 'block' as const,
    _key: `paragraph${index}`,
    markDefs: [],
    children: [plainSpan(text, index)],
  }));
}
