import { ADMIN_ROLE } from '@blog/db/constants';

import { isSuperAdmin } from './is-super-admin';

describe(isSuperAdmin, () => {
  it('is false without an admins row', () => {
    expect(isSuperAdmin(undefined)).toBe(false);
  });

  it.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR])(
    'is false for %s',
    (role) => {
      expect(isSuperAdmin({ role })).toBe(false);
    },
  );

  it('is true for SUPERADMIN', () => {
    expect(isSuperAdmin({ role: ADMIN_ROLE.SUPERADMIN })).toBe(true);
  });
});
