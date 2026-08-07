import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { resendConfirmation } from './resend-confirmation';

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
  await db.delete(schema.users);
});

async function insertUser(
  overrides: Partial<typeof schema.users.$inferInsert> = {},
): Promise<schema.TUser> {
  const [inserted] = await db
    .insert(schema.users)
    .values({ email: 'reader@example.com', ...overrides })
    .returning();

  if (!inserted) throw new Error('failed to seed a user row');

  return inserted;
}

describe(resendConfirmation, () => {
  it('returns the existing confirmation token for a pending subscriber', async () => {
    const user = await insertUser();
    const [subscriber] = await db
      .insert(schema.subscribers)
      .values({ email: 'reader@example.com' })
      .returning();
    if (!subscriber) throw new Error('failed to seed a subscriber row');

    const result = await resendConfirmation(user.id);

    expect(result).toEqual({
      outcome: 'pending',
      confirmationToken: subscriber.confirmationToken,
    });
  });

  it('does not rotate the token across repeated calls', async () => {
    const user = await insertUser();
    await db.insert(schema.subscribers).values({ email: 'reader@example.com' });

    const first = await resendConfirmation(user.id);
    const second = await resendConfirmation(user.id);

    expect(first).toEqual(second);
  });

  it('returns not-pending for an already-active subscriber', async () => {
    const user = await insertUser();
    await db
      .insert(schema.subscribers)
      .values({ email: 'reader@example.com', status: 'active' });

    const result = await resendConfirmation(user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending when no subscriber row matches the account email', async () => {
    const user = await insertUser();

    const result = await resendConfirmation(user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending for an unrecognized userId', async () => {
    const result = await resendConfirmation('does-not-exist');

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending when the user has no email on file', async () => {
    const user = await insertUser({ email: null });

    const result = await resendConfirmation(user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });
});
