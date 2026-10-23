import { ADMIN_ROLE, GRANTED_VIA } from '@blog/db/constants';
import type { TAdmin } from '@blog/db/schema/admins';

const ADMIN_GRANTED_AT = '2026-04-01T00:00:00.000Z';

export const MOCK_ADMIN_EMAIL = 'platform-admin@example.com';

export const makeAdmin = (overrides: Partial<TAdmin> = {}): TAdmin => ({
  id: 'admin-1',
  userId: 'user-1',
  role: ADMIN_ROLE.ADMIN,
  grantedBy: null,
  grantedVia: GRANTED_VIA.PROMOTION,
  grantedAt: new Date(ADMIN_GRANTED_AT),
  createdAt: new Date(ADMIN_GRANTED_AT),
  ...overrides,
});
