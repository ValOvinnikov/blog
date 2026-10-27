import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { mockAdmin } from '@platform/testing/admins/fixtures';

import { requireSuperAdmin } from './require-super-admin';

vi.mock('@platform/server/auth/require-admin');

describe(requireSuperAdmin, () => {
  it('passes on the failure of the admin gate', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT),
    );

    await expect(requireSuperAdmin()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );
  });

  it('404s when the admin row is below SUPERADMIN', async () => {
    await expect(requireSuperAdmin()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });

  it('resolves to the admin row when the role is SUPERADMIN', async () => {
    const admin = mockAdmin({ role: ADMIN_ROLE.SUPERADMIN });
    vi.mocked(requireAdmin).mockResolvedValueOnce(admin);

    const result = await requireSuperAdmin();

    expect(result).toEqual(admin);
  });
});
