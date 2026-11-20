import { faker } from '@faker-js/faker';
import { MOCK_EMAIL_BODY } from '@platform/testing/email-draft';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { EMAIL_TEMPLATE_TYPE } from '@shinefold/config';
import { EMAIL_NEW_POSTS_DEFAULT } from '@shinefold/db/constants';
import type { TEmailConfigResult } from '@shinefold/db/queries/email-config';
import type { TEmailTemplateResult } from '@shinefold/db/queries/email-templates';
import type { TEmailTemplateBlock } from '@shinefold/db/schema/email-templates';

export const MOCK_CONTACT_RECIPIENT = 'contact-inbox@acme.example';
export const MOCK_EMAIL_LOGO_URL =
  'https://example.blob.vercel-storage.com/sender-logo.png';
export const SEND_CONTACT_MESSAGES_TO = 'Send contact messages to';
export const SEND_TEST_TO_ME = 'Send test to me';
export const MOCK_TEST_EMAIL_LIMIT_REFUSAL = {
  count: 6,
  windowStartedAt: new Date('2026-11-20T09:00:00.000Z'),
  retryAt: '2026-11-20T10:00:00.000Z',
};
export const MOCK_NEWSLETTER_PAUSED_AT = new Date('2026-11-03T09:00:00.000Z');
export const MOCK_NEWSLETTER_PAUSED_ON_TEXT = 'Nov 3, 2026';
export const MOCK_TENANT_LOGO_TARGET = { type: 'tenant' } as const;
export const MOCK_TEMPLATE_LOGO_TARGET = {
  type: 'template',
  templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
} as const;

const MOCK_EMAIL_CONFIG_CREATED_AT = new Date('2026-04-02T00:00:00.000Z');

export const mockEmailConfig = (
  overrides: Partial<TEmailConfigResult> = {},
): TEmailConfigResult => ({
  id: faker.string.uuid(),
  tenantId: MOCK_TENANT_ID,
  logoAssetUrl: undefined,
  senderName: undefined,
  replyToAddress: undefined,
  footerPostalAddress: undefined,
  contactRecipient: undefined,
  emailNewPosts: EMAIL_NEW_POSTS_DEFAULT,
  createdAt: MOCK_EMAIL_CONFIG_CREATED_AT,
  updatedAt: MOCK_EMAIL_CONFIG_CREATED_AT,
  ...overrides,
});

const MOCK_LINK_KEY = 'link1';

export const mockEmailBodyWithText = (text: string): TEmailTemplateBlock[] => [
  {
    _type: 'block',
    _key: 'k1',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 's1', text, marks: [] }],
  },
];

export const mockEmailBodyWithLink = (href: string): TEmailTemplateBlock[] => [
  {
    _type: 'block',
    _key: 'k1',
    style: 'normal',
    markDefs: [{ _type: 'link', _key: MOCK_LINK_KEY, href }],
    children: [
      {
        _type: 'span',
        _key: 's1',
        text: faker.lorem.words(2),
        marks: [MOCK_LINK_KEY],
      },
    ],
  },
];

export const mockEmailTemplateResult = (
  overrides: Partial<TEmailTemplateResult> = {},
): TEmailTemplateResult => ({
  tenantId: MOCK_TENANT_ID,
  templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
  subject: faker.lorem.sentence(),
  body: MOCK_EMAIL_BODY,
  logoAssetUrl: undefined,
  ...overrides,
});
