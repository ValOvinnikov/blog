import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { exportAccountData } from './export-account-data';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query these functions build still runs as real SQL (see
// src/testing/create-test-db.ts), so a unique/foreign-key violation surfaces
// here the same way it would against Neon.
vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;
let tenantId: string;

// One in-memory Postgres instance for the whole file (spinning up pglite's
// WASM engine is the slow part — seconds, not milliseconds) — `afterEach`
// clears rows between tests instead of paying that cost per test.
beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(async () => {
  getDbMock.mockReturnValue(db);
  const tenant = await insertTestTenant(db, { slug: 'acme' });
  tenantId = tenant.id;
});

afterEach(async () => {
  await db.delete(schema.bookmarks);
  await db.delete(schema.users);
  await db.delete(schema.tenants);
});

describe(exportAccountData, () => {
  it('returns undefined for a userId with no matching users row', async () => {
    expect(await exportAccountData(tenantId, 'missing-user')).toBeUndefined();
  });

  it("aggregates the user's profile fields and bookmarks", async () => {
    await db.insert(schema.users).values({
      id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      image: 'https://example.com/avatar.png',
    });
    await db.insert(schema.bookmarks).values([
      {
        tenantId,
        userId: 'user-1',
        postId: 'post-older',
        createdAt: new Date(2026, 0, 1),
      },
      {
        tenantId,
        userId: 'user-1',
        postId: 'post-newer',
        createdAt: new Date(2026, 0, 2),
      },
    ]);

    const result = await exportAccountData(tenantId, 'user-1');

    expect(result).toEqual({
      profile: {
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        emailVerified: undefined,
        image: 'https://example.com/avatar.png',
      },
      bookmarks: [
        { postId: 'post-newer', createdAt: new Date(2026, 0, 2) },
        { postId: 'post-older', createdAt: new Date(2026, 0, 1) },
      ],
    });
  });

  it('maps unset nullable profile fields to undefined, never null', async () => {
    await db.insert(schema.users).values({ id: 'user-1' });

    const result = await exportAccountData(tenantId, 'user-1');

    expect(result?.profile).toEqual({
      id: 'user-1',
      name: undefined,
      email: undefined,
      emailVerified: undefined,
      image: undefined,
    });
  });

  it('returns an empty bookmarks array for a user with none', async () => {
    await db.insert(schema.users).values({ id: 'user-1' });

    const result = await exportAccountData(tenantId, 'user-1');

    expect(result?.bookmarks).toEqual([]);
  });

  it("does not include another user's bookmarks", async () => {
    await db.insert(schema.users).values([{ id: 'user-1' }, { id: 'user-2' }]);
    await db.insert(schema.bookmarks).values([
      { tenantId, userId: 'user-1', postId: 'post-1' },
      { tenantId, userId: 'user-2', postId: 'post-2' },
    ]);

    const result = await exportAccountData(tenantId, 'user-1');

    expect(result?.bookmarks.map((bookmark) => bookmark.postId)).toEqual([
      'post-1',
    ]);
  });

  it("does not include the user's bookmarks from another tenant", async () => {
    await db.insert(schema.users).values({ id: 'user-1' });
    const { id: otherTenantId } = await insertTestTenant(db, {
      slug: 'other',
    });
    await db.insert(schema.bookmarks).values([
      { tenantId, userId: 'user-1', postId: 'post-1' },
      { tenantId: otherTenantId, userId: 'user-1', postId: 'post-2' },
    ]);

    const result = await exportAccountData(tenantId, 'user-1');

    expect(result?.bookmarks.map((bookmark) => bookmark.postId)).toEqual([
      'post-1',
    ]);
  });
});
