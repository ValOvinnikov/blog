import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';

const { EN } = LOCALE_ISO_CODES;

export const mockInEnglish = (type: string, value: unknown) => [
  { _key: EN, _type: type, language: EN, value },
];

export const mockEnglishString = (value: string) =>
  mockInEnglish('internationalizedArrayStringValue', value);

export const mockParagraph = (text: string = faker.lorem.sentence()) => [
  {
    _type: 'block',
    _key: faker.string.alphanumeric(12),
    style: 'normal',
    children: [
      { _type: 'span', _key: faker.string.alphanumeric(12), text, marks: [] },
    ],
    markDefs: [],
  },
];

export const mockImageAsset = () => ({
  _type: 'reference',
  _ref: faker.string.uuid(),
});

export const mockEnglishText = (value: string) =>
  mockInEnglish('internationalizedArrayTextValue', value);

export const mockPlainHeadingBlock = (
  heading: string,
  supportingText?: string,
) => ({
  _type: 'headingBlock',
  heading,
  ...(supportingText === undefined ? {} : { supportingText }),
});

export const mockLocalizedHeadingBlock = (
  heading: string,
  supportingText?: string,
) => ({
  _type: 'localizedHeadingBlock',
  heading: mockEnglishString(heading),
  ...(supportingText === undefined
    ? {}
    : { supportingText: mockEnglishText(supportingText) }),
});

export const mockPlainImage = (
  asset: ReturnType<typeof mockImageAsset>,
  alt: string,
) => ({ _type: 'imageWithAlt', asset, alt });

export const mockLocalizedImage = (
  asset: ReturnType<typeof mockImageAsset>,
  alt: string,
) => ({ _type: 'localizedImageWithAlt', asset, alt: mockEnglishString(alt) });
