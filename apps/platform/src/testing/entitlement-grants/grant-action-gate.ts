import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { resolveLiveTenant } from '@platform/server/tenants/resolve-live-tenant';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockTenant } from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import { ADMIN_ROLE } from '@shinefold/db/constants';

export const MOCK_SUPER_ADMIN = mockAdmin({ role: ADMIN_ROLE.SUPERADMIN });

export const usePassedGrantActionGate = () => {
  beforeEach(() => {
    vi.mocked(requireSuperAdmin).mockResolvedValue(MOCK_SUPER_ADMIN);
    vi.mocked(resolveLiveTenant).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
      tenant: mockTenant(),
    });
  });
};
