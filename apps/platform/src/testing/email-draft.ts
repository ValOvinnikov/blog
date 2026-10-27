import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import { faker } from '@faker-js/faker';
import {
  buildEmailDraft,
  type TEmailDraft,
  type TEmailSenderDraft,
} from '@platform/utils/email-draft/email-draft';

const { EN, FR } = LOCALE_ISO_CODES;

export const MOCK_EMAIL_DRAFT_LIVE_LOCALES = [EN, FR];

export const MOCK_EMAIL_DRAFT_SUBJECT = 'Sign in';

export const MOCK_SENDER_FIELD_IDS = {
  senderName: faker.string.uuid(),
  contactRecipient: faker.string.uuid(),
};

export const mockEmailBody = (text: string): TEmailTemplateBlock[] => [
  {
    _type: 'block',
    _key: 'k1',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 's1', text, marks: [] }],
  },
];

export const MOCK_EMAIL_BODY = mockEmailBody('Hello');

export const mockEmailSender = (
  overrides: Partial<TEmailSenderDraft> = {},
): TEmailSenderDraft => ({
  senderName: '',
  replyToAddress: '',
  footerPostalAddress: '',
  contactRecipient: '',
  ...overrides,
});

export const mockEmailDraft = (): TEmailDraft =>
  buildEmailDraft({
    sender: mockEmailSender(),
    senderLogoUrl: undefined,
    authored: [
      {
        templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        locale: EN,
        subject: MOCK_EMAIL_DRAFT_SUBJECT,
        body: null,
      },
    ],
    templateLogoUrls: {
      MAGIC_LINK: undefined,
      TENANT_INVITE: undefined,
      NEWSLETTER_CONFIRMATION: undefined,
    },
    liveLocales: MOCK_EMAIL_DRAFT_LIVE_LOCALES,
  });
