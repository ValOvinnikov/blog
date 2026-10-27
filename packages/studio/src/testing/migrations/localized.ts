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
