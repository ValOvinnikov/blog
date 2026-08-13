import { ADMIN_ROLE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { createAdmin } from './create-admin';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query this function builds still runs as real SQL (see
// src/testing/create-test-db.ts), so the `userId` unique constraint and the
// foreign key under test are the real Postgres constraints, not mocked
// stand-ins.
vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertUser(id: string): Promise<void> {
  await db.insert(schema.users).values({ id });
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

describe(createAdmin, () => {
  it('inserts a new admin row', async () => {
    await insertUser('user-1');

    const admin = await createAdmin('user-1', ADMIN_ROLE.SUPERADMIN);

    expect(admin).toMatchObject({
      userId: 'user-1',
      role: ADMIN_ROLE.SUPERADMIN,
    });
  });

  it('is idempotent when the user already has an admin row', async () => {
    await insertUser('user-1');
    const first = await createAdmin('user-1', ADMIN_ROLE.SUPERADMIN);

    const second = await createAdmin('user-1', ADMIN_ROLE.SUPERADMIN);

    expect(second).toEqual(first);
    const rows = await db.select().from(schema.admins);
    expect(rows).toHaveLength(1);
  });

  it('does not change the stored role when re-run with a different role', async () => {
    await insertUser('user-1');
    const first = await createAdmin('user-1', ADMIN_ROLE.SUPERADMIN);

    const second = await createAdmin('user-1', ADMIN_ROLE.MODERATOR);

    // A no-op insert leaves the existing row (and its role) as-is —
    // re-granting a different role is a distinct, deliberate action this
    // function does not perform implicitly.
    expect(second).toEqual(first);
    expect(second.role).toBe(ADMIN_ROLE.SUPERADMIN);
  });

  it('rejects an admin grant for a user that does not exist', async () => {
    await expect(
      createAdmin('missing-user', ADMIN_ROLE.SUPERADMIN),
    ).rejects.toThrow();
  });
});

describe('foreign-key cascade', () => {
  it('removes an admin row when its owning user is deleted', async () => {
    await insertUser('user-1');
    await createAdmin('user-1', ADMIN_ROLE.SUPERADMIN);

    await db.delete(schema.users).where(eq(schema.users.id, 'user-1'));

    const rows = await db.select().from(schema.admins);
    expect(rows).toHaveLength(0);
  });
});
