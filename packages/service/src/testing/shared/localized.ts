import { mockReference } from '@blog/service/testing/shared/fixtures';
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
      _type: 'block',
      _key: text,
      style: 'normal',
      children: [{ _type: 'span', _key: 'span', text, marks: [] }],
      markDefs: [],
    },
  ];
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
    heading: mockLocalizedStrings(heading),
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
