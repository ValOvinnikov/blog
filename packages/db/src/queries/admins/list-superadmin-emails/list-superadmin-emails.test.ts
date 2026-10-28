import { ADMIN_ROLE, GRANTED_VIA, type TAdminRole } from '@blog/db/constants';
import { userPersonalColumns } from '@blog/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@blog/db/schema';
import { insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { listSuperadminEmails } from './list-superadmin-emails';

vi.mock('@blog/db/client');

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
