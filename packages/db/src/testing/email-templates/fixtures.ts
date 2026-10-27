import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import { faker } from '@faker-js/faker';

faker.seed(61003);

export const MOCK_CUSTOM_SUBJECT = faker.lorem.sentence();
export const MOCK_SECOND_SUBJECT = faker.lorem.sentence();
export const MOCK_ENGLISH_SUBJECT = faker.lorem.sentence();
export const MOCK_FRENCH_SUBJECT = faker.lorem.sentence();
export const MOCK_GERMAN_SUBJECT = faker.lorem.sentence();
export const MOCK_LOGO_URL = faker.internet.url();
export const MOCK_OTHER_LOGO_URL = faker.internet.url();

export const MOCK_CUSTOM_BODY: TEmailTemplateBlock[] = [
  {
    _type: 'block',
    _key: faker.string.alphanumeric(8),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: faker.string.alphanumeric(8),
        text: faker.lorem.sentence(),
        marks: [],
      },
    ],
  },
];
