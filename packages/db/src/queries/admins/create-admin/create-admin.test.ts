import { ADMIN_ROLE, GRANTED_VIA } from '@blog/db/constants';
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

    const admin = await createAdmin(
      'user-1',
      ADMIN_ROLE.SUPERADMIN,
      GRANTED_VIA.BREAK_GLASS,
    );

    expect(admin).toMatchObject({
      userId: 'user-1',
      role: ADMIN_ROLE.SUPERADMIN,
    });
  });

  it('is idempotent when the user already has an admin row', async () => {
    await insertUser('user-1');
    const first = await createAdmin(
      'user-1',
      ADMIN_ROLE.SUPERADMIN,
      GRANTED_VIA.BREAK_GLASS,
    );

    const second = await createAdmin(
      'user-1',
      ADMIN_ROLE.SUPERADMIN,
      GRANTED_VIA.BREAK_GLASS,
    );

    expect(second).toEqual(first);
    const rows = await db.select().from(schema.admins);
    expect(rows).toHaveLength(1);
  });

  it('does not change the stored role when re-run with a different role', async () => {
    await insertUser('user-1');
    const first = await createAdmin(
      'user-1',
      ADMIN_ROLE.SUPERADMIN,
      GRANTED_VIA.BREAK_GLASS,
    );

    const second = await createAdmin(
      'user-1',
      ADMIN_ROLE.MODERATOR,
      GRANTED_VIA.BREAK_GLASS,
    );

    // A no-op insert leaves the existing row (and its role) as-is —
    // re-granting a different role is a distinct, deliberate action this
    // function does not perform implicitly.
    expect(second).toEqual(first);
    expect(second.role).toBe(ADMIN_ROLE.SUPERADMIN);
  });

  it('rejects an admin grant for a user that does not exist', async () => {
    await expect(
      createAdmin(
        'missing-user',
        ADMIN_ROLE.SUPERADMIN,
        GRANTED_VIA.BREAK_GLASS,
      ),
    ).rejects.toThrow();
  });

  it('leaves grantedBy NULL and still sets grantedAt for a break-glass grant', async () => {
    await insertUser('user-1');

    const admin = await createAdmin(
      'user-1',
      ADMIN_ROLE.SUPERADMIN,
      GRANTED_VIA.BREAK_GLASS,
    );

    expect(admin.grantedVia).toBe(GRANTED_VIA.BREAK_GLASS);
    expect(admin.grantedBy).toBeNull();
    expect(admin.grantedAt).toBeInstanceOf(Date);
  });

  it('records the granting user id, grantedVia, and grantedAt for an in-app promotion', async () => {
    await insertUser('user-1');
    await insertUser('granter-1');

    const admin = await createAdmin(
      'user-1',
      ADMIN_ROLE.SUPERADMIN,
      GRANTED_VIA.PROMOTION,
      'granter-1',
    );

    expect(admin.grantedVia).toBe(GRANTED_VIA.PROMOTION);
    expect(admin.grantedBy).toBe('granter-1');
    expect(admin.grantedAt).toBeInstanceOf(Date);
  });

  it('keeps grantedVia as PROMOTION even after the granting user is deleted', async () => {
    await insertUser('user-1');
    await insertUser('granter-1');
    const admin = await createAdmin(
      'user-1',
      ADMIN_ROLE.SUPERADMIN,
      GRANTED_VIA.PROMOTION,
      'granter-1',
    );

    await db.delete(schema.users).where(eq(schema.users.id, 'granter-1'));

    const [row] = await db
      .select()
      .from(schema.admins)
      .where(eq(schema.admins.id, admin.id));

    // grantedBy went NULL along with the deleted granter, but grantedVia
    // still distinguishes this from a break-glass grant — the whole point
    // of not overloading grantedBy's NULL with two meanings.
    expect(row?.grantedBy).toBeNull();
    expect(row?.grantedVia).toBe(GRANTED_VIA.PROMOTION);
  });
});

describe('foreign-key cascade', () => {
  it('removes an admin row when its owning user is deleted', async () => {
    await insertUser('user-1');
    await createAdmin('user-1', ADMIN_ROLE.SUPERADMIN, GRANTED_VIA.BREAK_GLASS);

    await db.delete(schema.users).where(eq(schema.users.id, 'user-1'));

    const rows = await db.select().from(schema.admins);
    expect(rows).toHaveLength(0);
  });
});
