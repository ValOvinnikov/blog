import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import { createMockFaker } from '@blog/db/testing/mock-faker';

const emailTemplatesFaker = createMockFaker(61003);

export const MOCK_CUSTOM_SUBJECT = emailTemplatesFaker.lorem.sentence();
export const MOCK_SECOND_SUBJECT = emailTemplatesFaker.lorem.sentence();
export const MOCK_ENGLISH_SUBJECT = emailTemplatesFaker.lorem.sentence();
export const MOCK_FRENCH_SUBJECT = emailTemplatesFaker.lorem.sentence();
export const MOCK_GERMAN_SUBJECT = emailTemplatesFaker.lorem.sentence();
export const MOCK_LOGO_URL = emailTemplatesFaker.internet.url();
export const MOCK_OTHER_LOGO_URL = emailTemplatesFaker.internet.url();

export const MOCK_CUSTOM_BODY: TEmailTemplateBlock[] = [
  {
    _type: 'block',
    _key: emailTemplatesFaker.string.alphanumeric(8),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: emailTemplatesFaker.string.alphanumeric(8),
        text: emailTemplatesFaker.lorem.sentence(),
        marks: [],
      },
    ],
  },
];
