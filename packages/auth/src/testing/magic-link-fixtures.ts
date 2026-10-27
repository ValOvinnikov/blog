import {
  EMAIL_TEMPLATE_TYPE,
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  PRESET_ID,
} from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY, TENANT_PLAN } from '@blog/db/constants';
import type { TEmailConfigResult } from '@blog/db/queries/email-config/get-email-config/get-email-config';
import type { TEmailTemplateResult } from '@blog/db/queries/email-templates/get-email-template/get-email-template';
import type { TTenant } from '@blog/db/schema/tenants';
import { faker } from '@faker-js/faker';

export const MOCK_TENANT_ID = faker.string.uuid();
export const MOCK_OTHER_TENANT_ID = faker.string.uuid();
export const MOCK_TENANT_NAME = faker.lorem.words(2);
export const MOCK_INVITE_ID = faker.string.uuid();
export const MOCK_OTHER_INVITE_ID = faker.string.uuid();
export const MOCK_DB_ERROR_MESSAGE = faker.lorem.sentence();
export const MOCK_TOKEN = faker.string.alphanumeric(32);
export const MOCK_READER_EMAIL = faker.internet.exampleEmail();
export const MOCK_FROM_EMAIL = faker.internet.exampleEmail();
export const MOCK_FROM_ADDRESS = `${faker.lorem.words(2)} <${MOCK_FROM_EMAIL}>`;
export const MOCK_SENDER_NAME = faker.lorem.words(2);
export const MOCK_COMMA_NAME = 'Acme, Inc.';
export const MOCK_REPLY_TO = faker.internet.exampleEmail();
export const MOCK_POSTAL_ADDRESS = faker.location.streetAddress();
export const MOCK_SUBJECT = faker.lorem.sentence();
export const MOCK_TENANT_LOGO_URL = faker.internet.url({ appendSlash: true });
export const MOCK_TEMPLATE_LOGO_URL = faker.internet.url({ appendSlash: true });
export const MOCK_FRENCH_PATH = `/${LOCALE_BCP47_TAGS[LOCALE_ISO_CODES.FR]}/${faker.lorem.slug()}`;
export const MOCK_SITE_CONFIG = {
  preset: PRESET_ID.CONSOLE,
  accentHue: faker.number.int({ min: 0, max: 359 }),
  logoHue: undefined,
};

type TMockTenant = Pick<
  TTenant,
  'id' | 'name' | 'locale' | 'additionalLocales' | 'plan'
>;

export const mockTenant = (
  overrides: Partial<TMockTenant> = {},
): TMockTenant => ({
  id: MOCK_TENANT_ID,
  name: MOCK_TENANT_NAME,
  locale: LOCALE_ISO_CODES.EN,
  additionalLocales: [],
  plan: TENANT_PLAN.GROWTH,
  ...overrides,
});

export const mockPendingInvite = (
  overrides: Partial<{ id: string; tenantId: string }> = {},
) => ({
  id: MOCK_INVITE_ID,
  tenantId: MOCK_TENANT_ID,
  ...overrides,
});

type TMockEmailConfig = Pick<
  TEmailConfigResult,
  'logoAssetUrl' | 'senderName' | 'replyToAddress' | 'footerPostalAddress'
>;

export const mockEmailConfig = (
  overrides: Partial<TMockEmailConfig> = {},
): TMockEmailConfig => ({
  logoAssetUrl: undefined,
  senderName: undefined,
  replyToAddress: undefined,
  footerPostalAddress: undefined,
  ...overrides,
});

type TMockEmailTemplate = Pick<
  TEmailTemplateResult,
  'subject' | 'body' | 'logoAssetUrl'
>;

export const mockEmailTemplate = (
  overrides: Partial<TMockEmailTemplate> = {},
): TMockEmailTemplate => ({
  subject: EMAIL_TEMPLATE_DEFAULT_COPY[EMAIL_TEMPLATE_TYPE.MAGIC_LINK].subject,
  body: EMAIL_TEMPLATE_DEFAULT_COPY[EMAIL_TEMPLATE_TYPE.MAGIC_LINK].body,
  logoAssetUrl: undefined,
  ...overrides,
});
