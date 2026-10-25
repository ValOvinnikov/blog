import type { TValueOf } from '@blog/config/utils';
import { ADMIN_ROLE, GRANTED_VIA } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listSuperadminEmails } from './list-superadmin-emails';

vi.mock('@blog/db/client');

const MOCK_SUPER_ONE_EMAIL = 'super-one@example.com';
const MOCK_SUPER_TWO_EMAIL = 'super-two@example.com';
const MOCK_SUPER_EMAIL = 'super@example.com';
const MOCK_ADMIN_EMAIL = 'admin@example.com';

const db = useQueryTestDb();

async function insertAdmin(
  userId: string,
  role: TValueOf<typeof ADMIN_ROLE>,
): Promise<void> {
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
  it('returns the emails of every SUPERADMIN admin', async () => {
    await insertTestUser(db(), {
      id: 'user-1',
      email: MOCK_SUPER_ONE_EMAIL,
    });
    await insertTestUser(db(), {
      id: 'user-2',
      email: MOCK_SUPER_TWO_EMAIL,
    });
    await insertAdmin('user-1', ADMIN_ROLE.SUPERADMIN);
    await insertAdmin('user-2', ADMIN_ROLE.SUPERADMIN);

    const result = await listSuperadminEmails();

    expect(result).toEqual(
      expect.arrayContaining([MOCK_SUPER_ONE_EMAIL, MOCK_SUPER_TWO_EMAIL]),
    );
    expect(result).toHaveLength(2);
  });

  it('excludes ADMIN and MODERATOR admins', async () => {
    await insertTestUser(db(), { id: 'user-1', email: MOCK_SUPER_EMAIL });
    await insertTestUser(db(), { id: 'user-2', email: MOCK_ADMIN_EMAIL });
    await insertTestUser(db(), {
      id: 'user-3',
      email: 'moderator@example.com',
    });
    await insertAdmin('user-1', ADMIN_ROLE.SUPERADMIN);
    await insertAdmin('user-2', ADMIN_ROLE.ADMIN);
    await insertAdmin('user-3', ADMIN_ROLE.MODERATOR);

    const result = await listSuperadminEmails();

    expect(result).toEqual([MOCK_SUPER_EMAIL]);
  });

  it('returns an empty array when there are no SUPERADMIN admins', async () => {
    await insertTestUser(db(), { id: 'user-1', email: MOCK_ADMIN_EMAIL });
    await insertAdmin('user-1', ADMIN_ROLE.ADMIN);

    const result = await listSuperadminEmails();

    expect(result).toEqual([]);
  });

  it('returns an empty array when there are no admins at all', async () => {
    const result = await listSuperadminEmails();

    expect(result).toEqual([]);
  });
});
