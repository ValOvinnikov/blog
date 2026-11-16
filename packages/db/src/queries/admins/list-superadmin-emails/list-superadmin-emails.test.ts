import { faker } from '@faker-js/faker';
import {
  ADMIN_ROLE,
  GRANTED_VIA,
  type TAdminRole,
} from '@shinefold/db/constants';
import { userPersonalColumns } from '@shinefold/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@shinefold/db/schema';
import { insertTestUser } from '@shinefold/db/testing/fixtures';
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
  const { id: userId } = await insertTestUser(db(), user);
  await db().insert(schema.admins).values({
    userId,
    role,
    grantedVia: GRANTED_VIA.BREAK_GLASS,
  });
}

afterEach(async () => {
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(listSuperadminEmails, () => {
  it('lists the decrypted email of every SUPERADMIN', async () => {
    await insertAdmin(userPersonalColumns({ email: MOCK_SUPER_ONE_EMAIL }));
    await insertAdmin(userPersonalColumns({ email: MOCK_SUPER_TWO_EMAIL }));

    const emails = await listSuperadminEmails();

    expect(emails.sort()).toEqual(
      [MOCK_SUPER_ONE_EMAIL, MOCK_SUPER_TWO_EMAIL].sort(),
    );
  });

  it('drops a SUPERADMIN with no address', async () => {
    await insertAdmin({});
    await insertAdmin(userPersonalColumns({ email: MOCK_SUPER_ONE_EMAIL }));

    const emails = await listSuperadminEmails();

    expect(emails).toEqual([MOCK_SUPER_ONE_EMAIL]);
  });

  it('excludes ADMIN and MODERATOR admins', async () => {
    await insertAdmin(userPersonalColumns({ email: MOCK_SUPER_ONE_EMAIL }));
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

  it('returns an empty array when there are no admins at all', async () => {
    const emails = await listSuperadminEmails();

    expect(emails).toEqual([]);
  });
});
