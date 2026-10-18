import { ADMIN_ROLE, GRANTED_VIA } from '@blog/db/constants';
import type { TAdmin } from '@blog/db/schema/admins';

export const makeAdmin = (overrides: Partial<TAdmin> = {}): TAdmin => ({
  id: 'admin-1',
  userId: 'user-1',
  role: ADMIN_ROLE.ADMIN,
  grantedBy: null,
  grantedVia: GRANTED_VIA.PROMOTION,
  grantedAt: new Date('2026-04-01T00:00:00.000Z'),
  createdAt: new Date('2026-04-01T00:00:00.000Z'),
  ...overrides,
});
