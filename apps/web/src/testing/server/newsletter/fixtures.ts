import { LIST_UNSUBSCRIBE_ONE_CLICK } from '@blog/email';
import { faker } from '@faker-js/faker';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

export const MOCK_CONFIRMATION_TOKEN = faker.string.alphanumeric(16);

export const MOCK_UNSUBSCRIBE_TOKEN = faker.string.alphanumeric(16);

export const MOCK_REPLY_TO = faker.internet.email();

export const MOCK_UNSUBSCRIBE_URL = `${MOCK_TENANT_BASE_URL}/api/newsletter/unsubscribe?token=${MOCK_UNSUBSCRIBE_TOKEN}`;

export const MOCK_UNSUBSCRIBE_HEADERS = {
  'List-Unsubscribe': `<${MOCK_UNSUBSCRIBE_URL}>`,
  'List-Unsubscribe-Post': LIST_UNSUBSCRIBE_ONE_CLICK,
};

export const mockEmailConfig = (overrides: Record<string, unknown> = {}) => ({
  tenantId: MOCK_TENANT_ID,
  logoAssetUrl: undefined,
  senderName: undefined,
  replyToAddress: undefined,
  footerPostalAddress: undefined,
  ...overrides,
});
