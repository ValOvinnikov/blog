import type { schema } from '@blog/db';
import { DEFAULT_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

export const makeSubscriber = (
  overrides: Partial<schema.TSubscriber> = {},
): schema.TSubscriber => ({
  id: 'sub-1',
  tenantId: DEFAULT_TENANT_ID,
  email: 'reader@example.com',
  status: 'active',
  confirmationToken: 'confirm-token',
  unsubscribeToken: 'unsubscribe-token',
  subscribedAt: new Date('2026-01-01'),
  confirmedAt: new Date('2026-01-02'),
  confirmationSentAt: new Date('2026-01-01'),
  ...overrides,
});
