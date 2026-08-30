import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestAccount, insertTestUser } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getLinkedProviders } from './get-linked-providers';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query these functions build still runs as real SQL (see
// src/testing/create-test-db.ts).
vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

// One in-memory Postgres instance for the whole file (spinning up pglite's
// WASM engine is the slow part — seconds, not milliseconds) — `afterEach`
// clears rows between tests instead of paying that cost per test.
beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.accounts);
  await db.delete(schema.users);
});

describe(getLinkedProviders, () => {
  it('reports github and google linked from accounts rows', async () => {
    const user = await insertTestUser(db);
    await insertTestAccount(db, user.id, 'github');
    await insertTestAccount(db, user.id, 'google');

    const result = await getLinkedProviders(user.id);

    expect(result).toEqual({ github: true, google: true, emailLink: false });
  });

  it('reports only the linked provider when just one accounts row exists', async () => {
    const user = await insertTestUser(db);
    await insertTestAccount(db, user.id, 'github');

    const result = await getLinkedProviders(user.id);

    expect(result).toEqual({ github: true, google: false, emailLink: false });
  });

  it('reports emailLink linked from emailVerified with zero accounts rows', async () => {
    const user = await insertTestUser(db, {
      emailVerified: new Date(2026, 0, 1),
    });

    const result = await getLinkedProviders(user.id);

    expect(result).toEqual({ github: false, google: false, emailLink: true });
  });

  it('reports every method as false when nothing is linked', async () => {
    const user = await insertTestUser(db);

    const result = await getLinkedProviders(user.id);

    expect(result).toEqual({ github: false, google: false, emailLink: false });
  });

  it('reports every method as false for an unrecognized userId', async () => {
    const result = await getLinkedProviders('does-not-exist');

    expect(result).toEqual({ github: false, google: false, emailLink: false });
  });

  it("does not report another user's linked accounts", async () => {
    const user = await insertTestUser(db);
    const otherUser = await insertTestUser(db);
    await insertTestAccount(db, otherUser.id, 'github');

    const result = await getLinkedProviders(user.id);

    expect(result).toEqual({ github: false, google: false, emailLink: false });
  });
});
