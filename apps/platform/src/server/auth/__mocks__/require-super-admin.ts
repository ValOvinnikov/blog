import { ADMIN_ROLE } from '@blog/db/constants';
import type { TAdmin } from '@blog/db/schema/admins';
import { mockAdmin } from '@platform/testing/admins/fixtures';

export const requireSuperAdmin = vi.fn(async (): Promise<TAdmin> =>
  mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
);
