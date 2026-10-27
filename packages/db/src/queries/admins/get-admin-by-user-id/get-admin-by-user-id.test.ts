import { ADMIN_ROLE, GRANTED_VIA } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getAdminByUserId } from './get-admin-by-user-id';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(getAdminByUserId, () => {
  let userId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestUser(db()));
  });

  it('returns the row for an existing admin user', async () => {
    await db().insert(schema.admins).values({
      userId,
      role: ADMIN_ROLE.SUPERADMIN,
      grantedVia: GRANTED_VIA.BREAK_GLASS,
    });

    const result = await getAdminByUserId(userId);

    expect(result?.userId).toBe(userId);
    expect(result?.role).toBe(ADMIN_ROLE.SUPERADMIN);
  });

  it('returns undefined when the user is not an admin', async () => {
    const result = await getAdminByUserId(userId);

    expect(result).toBeUndefined();
  });
});
