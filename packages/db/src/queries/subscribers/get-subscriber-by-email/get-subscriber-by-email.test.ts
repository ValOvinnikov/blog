import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getSubscriberByEmail } from './get-subscriber-by-email';

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
  await db.delete(schema.subscribers);
});

describe(getSubscriberByEmail, () => {
  it('returns the row for an existing email', async () => {
    await db.insert(schema.subscribers).values({ email: 'reader@example.com' });

    const result = await getSubscriberByEmail('reader@example.com');

    expect(result).toMatchObject({
      email: 'reader@example.com',
      status: 'pending',
    });
  });

  it('normalizes casing/whitespace before looking the row up', async () => {
    await db.insert(schema.subscribers).values({ email: 'reader@example.com' });

    const result = await getSubscriberByEmail('  Reader@Example.com  ');

    expect(result).toMatchObject({ email: 'reader@example.com' });
  });

  it('returns undefined for an email with no row', async () => {
    const result = await getSubscriberByEmail('nobody@example.com');

    expect(result).toBeUndefined();
  });
});
