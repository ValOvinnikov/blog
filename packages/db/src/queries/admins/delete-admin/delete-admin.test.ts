import { faker } from '@faker-js/faker';
import { ADMIN_REMOVAL_OUTCOME } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import {
  insertTestAdmin,
  MOCK_SUPERADMIN_GRANT,
  useAdminRowCleanup,
} from '@shinefold/db/testing/admins/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { deleteAdmin } from './delete-admin';

vi.mock('@shinefold/db/client');

faker.seed(78661);

const MOCK_UNKNOWN_ADMIN_ID = faker.string.uuid();

const db = useQueryTestDb();

useAdminRowCleanup(db);

describe(deleteAdmin, () => {
  let superadminId: string;

  beforeEach(async () => {
    ({ id: superadminId } = await insertTestAdmin(
      db(),
      {},
      MOCK_SUPERADMIN_GRANT,
    ));
  });

  it('removes an admin who is not a super admin', async () => {
    const { id } = await insertTestAdmin(db());

    await expect(deleteAdmin(id)).resolves.toBe(ADMIN_REMOVAL_OUTCOME.REMOVED);

    const rows = await db().select().from(schema.admins);
    expect(rows).toHaveLength(1);
  });

  it('refuses to remove the last super admin', async () => {
    await insertTestAdmin(db());

    await expect(deleteAdmin(superadminId)).resolves.toBe(
      ADMIN_REMOVAL_OUTCOME.LAST_SUPERADMIN,
    );

    const rows = await db().select().from(schema.admins);
    expect(rows).toHaveLength(2);
  });

  it('removes a super admin while another remains', async () => {
    await insertTestAdmin(db(), {}, MOCK_SUPERADMIN_GRANT);

    await expect(deleteAdmin(superadminId)).resolves.toBe(
      ADMIN_REMOVAL_OUTCOME.REMOVED,
    );
  });

  it('reports an admin that does not exist as not found', async () => {
    await expect(deleteAdmin(MOCK_UNKNOWN_ADMIN_ID)).resolves.toBe(
      ADMIN_REMOVAL_OUTCOME.NOT_FOUND,
    );
  });
});
