import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
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
  await db.delete(schema.tenants);
  await db.delete(schema.users);
});

async function insertUser(
  overrides: Partial<typeof schema.users.$inferInsert> = {},
): Promise<schema.TUser> {
  return insertTestUser(db, { email: 'reader@example.com', ...overrides });
}

describe(resendConfirmation, () => {
  it('returns the existing confirmation token for a pending subscriber', async () => {
    const user = await insertUser();
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    const [subscriber] = await db
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' })
      .returning();
    if (!subscriber) throw new Error('failed to seed a subscriber row');

    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual({
      outcome: 'pending',
      confirmationToken: subscriber.confirmationToken,
    });
  });

  it('does not rotate the token across repeated calls', async () => {
    const user = await insertUser();
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    await db
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    const first = await resendConfirmation(tenantId, user.id);
    const second = await resendConfirmation(tenantId, user.id);

    expect(first).toEqual(second);
  });

  it('returns not-pending for an already-active subscriber', async () => {
    const user = await insertUser();
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });
    await db
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com', status: 'active' });

    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending when no subscriber row matches the account email', async () => {
    const user = await insertUser();
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });

    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending for an unrecognized userId', async () => {
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });

    const result = await resendConfirmation(tenantId, 'does-not-exist');

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending when the user has no email on file', async () => {
    const user = await insertUser({ email: null });
    const { id: tenantId } = await insertTestTenant(db, { slug: 'acme' });

    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending when the subscriber row belongs to a different tenant', async () => {
    const user = await insertUser();
    const { id: tenantOneId } = await insertTestTenant(db, { slug: 'acme' });
    const { id: tenantTwoId } = await insertTestTenant(db, { slug: 'other' });
    await db
      .insert(schema.subscribers)
      .values({ tenantId: tenantOneId, email: 'reader@example.com' });

    const result = await resendConfirmation(tenantTwoId, user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });
});
