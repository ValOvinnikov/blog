import { ADMIN_ROLE, GRANTED_VIA } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getFirstAdminEmail } from './get-first-admin-email';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertUser(id: string, email: string | null): Promise<void> {
  await db.insert(schema.users).values({ id, email });
}

async function insertAdmin(
  userId: string,
  createdAt: Date,
  role: (typeof ADMIN_ROLE)[keyof typeof ADMIN_ROLE] = ADMIN_ROLE.SUPERADMIN,
): Promise<void> {
  await db.insert(schema.admins).values({
    userId,
    role,
    grantedVia: GRANTED_VIA.BREAK_GLASS,
    createdAt,
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

describe(getFirstAdminEmail, () => {
  it('returns the email of the earliest-created admin row', async () => {
    await insertUser('user-1', 'first@example.com');
    await insertUser('user-2', 'second@example.com');
    await insertAdmin('user-1', new Date('2026-01-01T00:00:00Z'));
    await insertAdmin('user-2', new Date('2026-02-01T00:00:00Z'));

    const result = await getFirstAdminEmail();

    expect(result).toBe('first@example.com');
  });

  it('ignores insertion order and only orders by createdAt', async () => {
    await insertUser('user-1', 'later@example.com');
    await insertUser('user-2', 'earlier@example.com');
    await insertAdmin('user-1', new Date('2026-03-01T00:00:00Z'));
    await insertAdmin('user-2', new Date('2026-01-15T00:00:00Z'));

    const result = await getFirstAdminEmail();

    expect(result).toBe('earlier@example.com');
  });

  it('returns undefined when there are no admins rows at all', async () => {
    const result = await getFirstAdminEmail();

    expect(result).toBeUndefined();
  });

  it('returns undefined when the earliest admin has no email on file', async () => {
    await insertUser('user-1', null);
    await insertAdmin('user-1', new Date('2026-01-01T00:00:00Z'));

    const result = await getFirstAdminEmail();

    expect(result).toBeUndefined();
  });

  it('is not filtered by role — the earliest row wins regardless of its role value', async () => {
    await insertUser('user-1', 'moderator@example.com');
    await insertUser('user-2', 'superadmin@example.com');
    await insertAdmin(
      'user-1',
      new Date('2026-01-01T00:00:00Z'),
      ADMIN_ROLE.MODERATOR,
    );
    await insertAdmin(
      'user-2',
      new Date('2026-02-01T00:00:00Z'),
      ADMIN_ROLE.SUPERADMIN,
    );

    const result = await getFirstAdminEmail();

    expect(result).toBe('moderator@example.com');
  });
});
