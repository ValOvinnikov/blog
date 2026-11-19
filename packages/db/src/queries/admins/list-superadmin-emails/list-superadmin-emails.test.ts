import { faker } from '@faker-js/faker';
import { ADMIN_ROLE, type TAdminRole } from '@shinefold/db/constants';
import { userPersonalColumns } from '@shinefold/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@shinefold/db/schema';
import {
  insertTestAdmin,
  MOCK_SUPERADMIN_GRANT,
} from '@shinefold/db/testing/admins/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { listSuperadminEmails } from './list-superadmin-emails';

vi.mock('@shinefold/db/client');

faker.seed(5765);

const MOCK_SUPER_ONE_EMAIL = faker.internet.email().toLowerCase();
const MOCK_SUPER_TWO_EMAIL = faker.internet.email().toLowerCase();
const MOCK_ADMIN_EMAIL = faker.internet.email().toLowerCase();
const MOCK_MODERATOR_EMAIL = faker.internet.email().toLowerCase();

const db = useQueryTestDb();

async function insertAdmin(
  user: Partial<typeof schema.users.$inferInsert>,
  role: TAdminRole = ADMIN_ROLE.SUPERADMIN,
): Promise<void> {
  await insertTestAdmin(db(), user, { ...MOCK_SUPERADMIN_GRANT, role });
}

afterEach(async () => {
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(listSuperadminEmails, () => {
  describe('with a SUPERADMIN who has an address', () => {
    beforeEach(async () => {
      await insertAdmin(userPersonalColumns({ email: MOCK_SUPER_ONE_EMAIL }));
    });

    it('lists the decrypted email of every SUPERADMIN', async () => {
      await insertAdmin(userPersonalColumns({ email: MOCK_SUPER_TWO_EMAIL }));

      const emails = await listSuperadminEmails();

      expect(emails.sort()).toEqual(
        [MOCK_SUPER_ONE_EMAIL, MOCK_SUPER_TWO_EMAIL].sort(),
      );
    });

    it('drops a SUPERADMIN with no address', async () => {
      await insertAdmin({});

      const emails = await listSuperadminEmails();

      expect(emails).toEqual([MOCK_SUPER_ONE_EMAIL]);
    });

    it('excludes ADMIN and MODERATOR admins', async () => {
      await insertAdmin(
        userPersonalColumns({ email: MOCK_ADMIN_EMAIL }),
        ADMIN_ROLE.ADMIN,
      );
      await insertAdmin(
        userPersonalColumns({ email: MOCK_MODERATOR_EMAIL }),
        ADMIN_ROLE.MODERATOR,
      );

      const emails = await listSuperadminEmails();

      expect(emails).toEqual([MOCK_SUPER_ONE_EMAIL]);
    });
  });

  it('returns an empty array when there are no admins at all', async () => {
    const emails = await listSuperadminEmails();

    expect(emails).toEqual([]);
  });
});
