import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { createPendingSubscriber } from './create-pending-subscriber';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

// Only `getDb`'s return value is swapped for an in-memory Postgres — every
// query these functions build still runs as real SQL (see
// src/testing/create-test-db.ts), so the `email` unique constraint under
// test is the real Postgres constraint, not a mocked stand-in.
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

describe(createPendingSubscriber, () => {
  it('inserts a new pending row for a fresh email', async () => {
    const result = await createPendingSubscriber('reader@example.com');

    expect(result.outcome).toBe('created');
    expect(result.subscriber).toMatchObject({
      email: 'reader@example.com',
      status: 'pending',
    });
    expect(result.subscriber.confirmationToken).toEqual(expect.any(String));
    expect(result.subscriber.confirmedAt).toBeNull();

    const rows = await db.select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('normalizes email casing/whitespace so it collides with an existing row', async () => {
    const first = await createPendingSubscriber('Reader@Example.com');

    const second = await createPendingSubscriber('  reader@example.com  ');

    expect(second.outcome).toBe('already-pending');
    expect(second.subscriber.id).toBe(first.subscriber.id);
    const rows = await db.select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('is idempotent-safe for a duplicate submission while still pending', async () => {
    const first = await createPendingSubscriber('reader@example.com');

    const second = await createPendingSubscriber('reader@example.com');

    expect(second).toEqual({
      outcome: 'already-pending',
      subscriber: first.subscriber,
    });
    // The token is not rotated — the already-sent confirmation email's link
    // must keep working.
    expect(second.subscriber.confirmationToken).toBe(
      first.subscriber.confirmationToken,
    );
    const rows = await db.select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });

  it('reports already-active for an email that already confirmed, without inserting or erroring', async () => {
    await db.insert(schema.subscribers).values({
      email: 'reader@example.com',
      status: 'active',
      confirmedAt: new Date(),
    });

    const result = await createPendingSubscriber('reader@example.com');

    expect(result.outcome).toBe('already-active');
    expect(result.subscriber.status).toBe('active');
    const rows = await db.select().from(schema.subscribers);
    expect(rows).toHaveLength(1);
  });
});
