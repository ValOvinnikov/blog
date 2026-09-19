import { ADMIN_ROLE, GRANTED_VIA } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getAdminByUserId } from './get-admin-by-user-id';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(getAdminByUserId, () => {
  it('returns the row for an existing admin user', async () => {
    await insertTestUser(db(), { id: 'user-1' });
    await db().insert(schema.admins).values({
      userId: 'user-1',
      role: ADMIN_ROLE.SUPERADMIN,
      grantedVia: GRANTED_VIA.BREAK_GLASS,
    });

    const result = await getAdminByUserId('user-1');

    expect(result).toMatchObject({
      userId: 'user-1',
      role: ADMIN_ROLE.SUPERADMIN,
    });
  });

  it('returns undefined when the user is not an admin', async () => {
    await insertTestUser(db(), { id: 'user-1' });

    const result = await getAdminByUserId('user-1');

    expect(result).toBeUndefined();
  });
});

// FK cascade and unique-constraint coverage for the admins table lives in
// create-admin.test.ts, which exercises them through the real write path
// (createAdmin) rather than duplicating raw-insert assertions here.
