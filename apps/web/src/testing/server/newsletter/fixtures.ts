import { EMAIL_TEMPLATE_TYPE } from '@blog/config';
import type { TEmailConfigResult } from '@blog/db/queries/email-config/get-email-config/get-email-config';
import type { TEmailTemplateResult } from '@blog/db/queries/email-templates/get-email-template/get-email-template';
import type { TSendEmailInput } from '@blog/email';
import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import type { Mock } from 'vitest';

faker.seed(61064);

export const MOCK_CONFIRMATION_TOKEN = faker.string.alphanumeric(16);

export const MOCK_UNSUBSCRIBE_TOKEN = faker.string.alphanumeric(16);

export const MOCK_REPLY_TO = faker.internet.email();

export const MOCK_AUTHORED_SUBJECT = faker.lorem.sentence();

const MOCK_EMAIL_CONFIG_ID = faker.string.uuid();

const MOCK_EMAIL_CONFIG_CREATED_AT = faker.date.past();

export const mockEmailConfig = (
  overrides: Partial<TEmailConfigResult> = {},
): TEmailConfigResult => ({
  id: MOCK_EMAIL_CONFIG_ID,
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

export const mockEmailTemplate = (
  overrides: Partial<TEmailTemplateResult> = {},
): TEmailTemplateResult => ({
  tenantId: MOCK_TENANT_ID,
  templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
  subject: MOCK_AUTHORED_SUBJECT,
  body: [],
  logoAssetUrl: undefined,
  ...overrides,
});

export const firstSentEmail = (
  sendEmailMock: Mock<(input: TSendEmailInput) => unknown>,
): TSendEmailInput => {
  const [[email]] = sendEmailMock.mock.calls as [[TSendEmailInput]];
  return email;
};
