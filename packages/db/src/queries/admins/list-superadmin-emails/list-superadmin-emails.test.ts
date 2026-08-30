import { ADMIN_ROLE, GRANTED_VIA } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestUser } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { listSuperadminEmails } from './list-superadmin-emails';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertAdmin(
  userId: string,
  role: (typeof ADMIN_ROLE)[keyof typeof ADMIN_ROLE],
): Promise<void> {
  await db.insert(schema.admins).values({
    userId,
    role,
    grantedVia: GRANTED_VIA.BREAK_GLASS,
  });
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.admins);
  await db.delete(schema.users);
});

describe(listSuperadminEmails, () => {
  it('returns the emails of every SUPERADMIN admin', async () => {
    await insertTestUser(db, { id: 'user-1', email: 'super-one@example.com' });
    await insertTestUser(db, { id: 'user-2', email: 'super-two@example.com' });
    await insertAdmin('user-1', ADMIN_ROLE.SUPERADMIN);
    await insertAdmin('user-2', ADMIN_ROLE.SUPERADMIN);

    const result = await listSuperadminEmails();

    expect(result).toEqual(
      expect.arrayContaining([
        'super-one@example.com',
        'super-two@example.com',
      ]),
    );
    expect(result).toHaveLength(2);
  });

  it('excludes ADMIN and MODERATOR admins', async () => {
    await insertTestUser(db, { id: 'user-1', email: 'super@example.com' });
    await insertTestUser(db, { id: 'user-2', email: 'admin@example.com' });
    await insertTestUser(db, { id: 'user-3', email: 'moderator@example.com' });
    await insertAdmin('user-1', ADMIN_ROLE.SUPERADMIN);
    await insertAdmin('user-2', ADMIN_ROLE.ADMIN);
    await insertAdmin('user-3', ADMIN_ROLE.MODERATOR);

    const result = await listSuperadminEmails();

    expect(result).toEqual(['super@example.com']);
  });

  it('returns an empty array when there are no SUPERADMIN admins', async () => {
    await insertTestUser(db, { id: 'user-1', email: 'admin@example.com' });
    await insertAdmin('user-1', ADMIN_ROLE.ADMIN);

    const result = await listSuperadminEmails();

    expect(result).toEqual([]);
  });

  it('returns an empty array when there are no admins at all', async () => {
    const result = await listSuperadminEmails();

    expect(result).toEqual([]);
  });
});
