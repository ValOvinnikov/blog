import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import type { TEmailConfigResult } from '@blog/db/queries/email-config';
import type { TEmailTemplateResult } from '@blog/db/queries/email-templates';
import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import { faker } from '@faker-js/faker';
import { MOCK_EMAIL_BODY } from '@platform/testing/email-draft';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

export const MOCK_CONTACT_RECIPIENT = 'contact-inbox@acme.example';
export const MOCK_EMAIL_LOGO_URL =
  'https://example.blob.vercel-storage.com/sender-logo.png';
export const SEND_CONTACT_MESSAGES_TO = 'Send contact messages to';
export const SEND_TEST_TO_ME = 'Send test to me';

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
