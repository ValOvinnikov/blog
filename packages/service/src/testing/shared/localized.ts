import { faker } from '@faker-js/faker';
import { LINK_TYPE } from '@shinefold/config';
import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import type { TRawModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { mockReference } from '@shinefold/service/testing/shared/fixtures';

type TLocalizedText = Partial<Record<string, string>>;

export const MOCK_ENGLISH_TEXT = 'Read on.';
export const MOCK_DUTCH_TEXT = 'Lees verder.';
export const MOCK_IMAGE_ASSET_DOCUMENT_ID = 'image-1';
export const MOCK_IMAGE_ASSET_DOCUMENT = {
  _id: MOCK_IMAGE_ASSET_DOCUMENT_ID,
  _type: 'sanity.imageAsset',
};

export function mockLocalizedEntry(language: string, value: unknown) {
  return { _key: language, language, value };
}

export function mockTranslationLink(language: string, id: string) {
  return mockLocalizedEntry(language, mockReference(id));
}

export function mockLocalizedValues(
  type: string,
  values: Partial<Record<string, unknown>>,
) {
  return Object.entries(values).map(([language, value]) => ({
    _key: language,
    _type: type,
    language,
    value,
  }));
}

export function mockLocalizedStrings(values: TLocalizedText) {
  return mockLocalizedValues('internationalizedArrayStringValue', values);
}

export function mockParagraphBlocks(text: string) {
  return [
    {
      _type: 'block' as const,
      _key: text,
      style: 'normal' as const,
      children: [{ _type: 'span' as const, _key: 'span', text, marks: [] }],
      markDefs: [],
    },
  ];
}

function mockPlainHeadingPieces(text: string) {
  return [{ text, isHighlighted: false }];
}

export function mockModuleHeadingBlockView(
  heading: string,
  supportingText?: string,
) {
  return {
    heading,
    headingPieces: mockPlainHeadingPieces(heading),
    supportingText,
  };
}

export function mockRawModuleHeadingBlock(
  heading: string,
  overrides: Partial<Omit<TRawModuleHeadingBlock, 'heading'>> = {},
): TRawModuleHeadingBlock {
  return {
    heading: mockParagraphBlocks(heading),
    supportingText: null,
    ...overrides,
  };
}

function mockLocalizedParagraphs(type: string, values: TLocalizedText) {
  return mockLocalizedValues(
    type,
    Object.fromEntries(
      Object.entries(values).map(([language, text]) => [
        language,
        mockParagraphBlocks(text ?? ''),
      ]),
    ),
  );
}

export function mockLocalizedListedText(values: TLocalizedText) {
  return mockLocalizedParagraphs(
    'internationalizedArrayListedTextValue',
    values,
  );
}

export function mockLocalizedParagraphText(values: TLocalizedText) {
  return mockLocalizedParagraphs(
    'internationalizedArrayParagraphTextValue',
    values,
  );
}

export function mockLocalizedHeadingBlock(
  heading: TLocalizedText,
  fields: Record<string, unknown> = {},
) {
  return {
    _type: 'moduleHeadingBlock',
    heading: mockLocalizedParagraphs(
      'internationalizedArrayHeadingTextValue',
      heading,
    ),
    ...fields,
  };
}

export function mockLocalizedImage(alt: TLocalizedText) {
  return {
    _type: 'localizedImageWithAlt',
    asset: mockReference(MOCK_IMAGE_ASSET_DOCUMENT_ID),
    alt: mockLocalizedStrings(alt),
  };
}

export function mockLocalizedLinkDocument(_id: string, label: string) {
  return {
    _id,
    _type: 'link',
    linkType: LINK_TYPE.EXTERNAL,
    label: mockLocalizedStrings({ [LOCALE_ISO_CODES.EN]: label }),
    url: mockLocalizedStrings({ [LOCALE_ISO_CODES.EN]: faker.internet.url() }),
  };
}
