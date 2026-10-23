import type { schema } from '@blog/db';
import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

const SUBSCRIBER_ID = faker.string.uuid();
const SUBSCRIBER_EMAIL = faker.internet.email();
const CONFIRMATION_TOKEN_HASH = faker.string.hexadecimal({ length: 64 });
const UNSUBSCRIBE_TOKEN_HASH = faker.string.hexadecimal({ length: 64 });
const SUBSCRIBED_AT = faker.date.past();
const CONFIRMED_AT = faker.date.soon({ refDate: SUBSCRIBED_AT });

export const mockSubscriber = (
  overrides: Partial<schema.TSubscriber> = {},
): schema.TSubscriber => ({
  id: SUBSCRIBER_ID,
  tenantId: MOCK_TENANT_ID,
  email: SUBSCRIBER_EMAIL,
  emailEncrypted: null,
  emailIndex: null,
  status: 'active',
  confirmationTokenHash: CONFIRMATION_TOKEN_HASH,
  unsubscribeTokenHash: UNSUBSCRIBE_TOKEN_HASH,
  subscribedAt: SUBSCRIBED_AT,
  confirmedAt: CONFIRMED_AT,
  confirmationSentAt: SUBSCRIBED_AT,
  ...overrides,
});
