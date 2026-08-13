import { ADMIN_ROLE, GRANTED_VIA } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getAdminByUserId } from './get-admin-by-user-id';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

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

describe(getAdminByUserId, () => {
  it('returns the row for an existing admin user', async () => {
    await insertUser('user-1');
    await db.insert(schema.admins).values({
      userId: 'user-1',
      role: ADMIN_ROLE.SUPERADMIN,
      grantedVia: GRANTED_VIA.BREAK_GLASS,
    });

    const result = await getAdminByUserId('user-1');

    expect(result).toMatchObject({
      userId: 'user-1',
      role: ADMIN_ROLE.SUPERADMIN,
    });
  });

  it('returns undefined when the user is not an admin', async () => {
    await insertUser('user-1');

    const result = await getAdminByUserId('user-1');

    expect(result).toBeUndefined();
  });
});

describe('foreign-key cascade', () => {
  it('removes an admin row when its owning user is deleted', async () => {
    await insertUser('user-1');
    await db.insert(schema.admins).values({
      userId: 'user-1',
      role: ADMIN_ROLE.ADMIN,
      grantedVia: GRANTED_VIA.BREAK_GLASS,
    });

    await db.delete(schema.users).where(eq(schema.users.id, 'user-1'));

    const rows = await db.select().from(schema.admins);
    expect(rows).toHaveLength(0);
  });
});

describe('unique constraint', () => {
  it('rejects a second admin row for the same user', async () => {
    await insertUser('user-1');
    await db.insert(schema.admins).values({
      userId: 'user-1',
      role: ADMIN_ROLE.MODERATOR,
      grantedVia: GRANTED_VIA.BREAK_GLASS,
    });

    await expect(
      db.insert(schema.admins).values({
        userId: 'user-1',
        role: ADMIN_ROLE.SUPERADMIN,
        grantedVia: GRANTED_VIA.BREAK_GLASS,
      }),
    ).rejects.toThrow();
  });
});
