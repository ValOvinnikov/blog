import { ADMIN_ROLE } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import {
  insertTestAdminForUser,
  MOCK_SUPERADMIN_GRANT,
} from '@shinefold/db/testing/admins/fixtures';
import { insertTestUser } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { getAdminByUserId } from './get-admin-by-user-id';

vi.mock('@shinefold/db/client');

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
    await insertTestAdminForUser(db(), userId, MOCK_SUPERADMIN_GRANT);

    const result = await getAdminByUserId(userId);

    expect(result?.userId).toBe(userId);
    expect(result?.role).toBe(ADMIN_ROLE.SUPERADMIN);
  });

  it('returns undefined when the user is not an admin', async () => {
    const result = await getAdminByUserId(userId);

    expect(result).toBeUndefined();
  });
});
