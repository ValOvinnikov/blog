import { ADMIN_ROLE, GRANTED_VIA } from '@shinefold/db/constants';
import { userPersonalColumns } from '@shinefold/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@shinefold/db/schema';
import { insertTestAdmin } from '@shinefold/db/testing/admins/fixtures';
import {
  MOCK_USER_EMAIL,
  MOCK_USER_NAME,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { listAdmins } from './list-admins';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(listAdmins, () => {
  it('lists each admin with the decrypted name and email of their account', async () => {
    const { id, userId, grantedAt } = await insertTestAdmin(
      db(),
      userPersonalColumns({ email: MOCK_USER_EMAIL, name: MOCK_USER_NAME }),
    );

    await expect(listAdmins()).resolves.toEqual([
      {
        adminId: id,
        userId,
        name: MOCK_USER_NAME,
        email: MOCK_USER_EMAIL,
        role: ADMIN_ROLE.ADMIN,
        grantedVia: GRANTED_VIA.PROMOTION,
        grantedAt,
      },
    ]);
  });

  it('gives null for an account with no name or email', async () => {
    await insertTestAdmin(db());

    const [admin] = await listAdmins();

    expect(admin?.name).toBeNull();
    expect(admin?.email).toBeNull();
  });
});
