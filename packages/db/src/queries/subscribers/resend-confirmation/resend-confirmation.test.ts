import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
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

async function insertTenant(slug: string): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug,
      name: slug,
      primaryDomain: `${slug}.example.com`,
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();
  return tenant!.id;
}

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
    const tenantId = await insertTenant('acme');
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
    const tenantId = await insertTenant('acme');
    await db
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    const first = await resendConfirmation(tenantId, user.id);
    const second = await resendConfirmation(tenantId, user.id);

    expect(first).toEqual(second);
  });

  it('returns not-pending for an already-active subscriber', async () => {
    const user = await insertUser();
    const tenantId = await insertTenant('acme');
    await db
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com', status: 'active' });

    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending when no subscriber row matches the account email', async () => {
    const user = await insertUser();
    const tenantId = await insertTenant('acme');

    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending for an unrecognized userId', async () => {
    const tenantId = await insertTenant('acme');

    const result = await resendConfirmation(tenantId, 'does-not-exist');

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending when the user has no email on file', async () => {
    const user = await insertUser({ email: null });
    const tenantId = await insertTenant('acme');

    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending when the subscriber row belongs to a different tenant', async () => {
    const user = await insertUser();
    const tenantOneId = await insertTenant('acme');
    const tenantTwoId = await insertTenant('other');
    await db
      .insert(schema.subscribers)
      .values({ tenantId: tenantOneId, email: 'reader@example.com' });

    const result = await resendConfirmation(tenantTwoId, user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });
});
