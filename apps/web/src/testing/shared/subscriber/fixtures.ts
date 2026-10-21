import type { schema } from '@blog/db';
import { DEFAULT_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

const SUBSCRIBED_AT = '2026-01-01';

export const makeSubscriber = (
  overrides: Partial<schema.TSubscriber> = {},
): schema.TSubscriber => ({
  id: 'sub-1',
  tenantId: DEFAULT_TENANT_ID,
  email: 'reader@example.com',
  status: 'active',
  confirmationTokenHash: 'confirm-token-hash',
  unsubscribeTokenHash: 'unsubscribe-token-hash',
  subscribedAt: new Date(SUBSCRIBED_AT),
  confirmedAt: new Date('2026-01-02'),
  confirmationSentAt: new Date(SUBSCRIBED_AT),
  ...overrides,
});
