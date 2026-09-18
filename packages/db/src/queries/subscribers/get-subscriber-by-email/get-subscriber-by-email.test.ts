import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getSubscriberByEmail } from './get-subscriber-by-email';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

// One in-memory Postgres instance for the whole file (spinning up pglite's
// WASM engine is the slow part — seconds, not milliseconds) — `afterEach`
// clears rows between tests instead of paying that cost per test.

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(getSubscriberByEmail, () => {
  it('returns the row for an existing email', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    const result = await getSubscriberByEmail(tenantId, 'reader@example.com');

    expect(result).toMatchObject({
      email: 'reader@example.com',
      status: 'pending',
    });
  });

  it('normalizes casing/whitespace before looking the row up', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    const result = await getSubscriberByEmail(
      tenantId,
      '  Reader@Example.com  ',
    );

    expect(result).toMatchObject({ email: 'reader@example.com' });
  });

  it('returns undefined for an email with no row', async () => {
    const { id: tenantId } = await insertTestTenant(db());

    const result = await getSubscriberByEmail(tenantId, 'nobody@example.com');

    expect(result).toBeUndefined();
  });

  it("returns undefined for another tenant's row with the same email", async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId: tenantOneId, email: 'reader@example.com' });

    const result = await getSubscriberByEmail(
      tenantTwoId,
      'reader@example.com',
    );

    expect(result).toBeUndefined();
  });
});
