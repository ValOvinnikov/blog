import { ADMIN_ROLE, GRANTED_VIA } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { listSuperadminEmails } from './list-superadmin-emails';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertUser(id: string, email: string | null): Promise<void> {
  await db.insert(schema.users).values({ id, email });
}

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
    await insertUser('user-1', 'super-one@example.com');
    await insertUser('user-2', 'super-two@example.com');
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
    await insertUser('user-1', 'super@example.com');
    await insertUser('user-2', 'admin@example.com');
    await insertUser('user-3', 'moderator@example.com');
    await insertAdmin('user-1', ADMIN_ROLE.SUPERADMIN);
    await insertAdmin('user-2', ADMIN_ROLE.ADMIN);
    await insertAdmin('user-3', ADMIN_ROLE.MODERATOR);

    const result = await listSuperadminEmails();

    expect(result).toEqual(['super@example.com']);
  });

  it('returns an empty array when there are no SUPERADMIN admins', async () => {
    await insertUser('user-1', 'admin@example.com');
    await insertAdmin('user-1', ADMIN_ROLE.ADMIN);

    const result = await listSuperadminEmails();

    expect(result).toEqual([]);
  });

  it('returns an empty array when there are no admins at all', async () => {
    const result = await listSuperadminEmails();

    expect(result).toEqual([]);
  });
});
