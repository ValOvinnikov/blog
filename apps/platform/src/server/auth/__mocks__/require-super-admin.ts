import { mockAdmin } from '@platform/testing/admins/fixtures';
import { ADMIN_ROLE } from '@shinefold/db/constants';
import type { TAdmin } from '@shinefold/db/schema/admins';

export const requireSuperAdmin = vi.fn(async (): Promise<TAdmin> =>
  mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
);
