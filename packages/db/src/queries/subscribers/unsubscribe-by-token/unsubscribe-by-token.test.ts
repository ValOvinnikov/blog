import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { unsubscribeByToken } from './unsubscribe-by-token';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

async function insertSubscriber(
  tenantId: string,
  overrides: Partial<typeof schema.subscribers.$inferInsert> = {},
): Promise<schema.TSubscriber> {
  const [inserted] = await db()
    .insert(schema.subscribers)
    .values({ tenantId, email: 'reader@example.com', ...overrides })
    .returning();

  if (!inserted) throw new Error('failed to seed a subscriber row');

  return inserted;
}

describe(unsubscribeByToken, () => {
  it('deletes the subscriber row matching the unsubscribe token', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const subscriber = await insertSubscriber(tenantId);

    const result = await unsubscribeByToken(
      tenantId,
      subscriber.unsubscribeToken,
    );

    expect(result).toEqual({ outcome: 'unsubscribed', subscriber });

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, subscriber.id));
    expect(rows).toHaveLength(0);
  });

  it('returns not-found for an unrecognized token', async () => {
    const { id: tenantId } = await insertTestTenant(db());

    const result = await unsubscribeByToken(tenantId, 'does-not-exist');

    expect(result).toEqual({ outcome: 'not-found' });
  });

  it('returns not-found on a second use of the same token', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const subscriber = await insertSubscriber(tenantId);

    const first = await unsubscribeByToken(
      tenantId,
      subscriber.unsubscribeToken,
    );
    const second = await unsubscribeByToken(
      tenantId,
      subscriber.unsubscribeToken,
    );

    expect(first).toEqual({ outcome: 'unsubscribed', subscriber });
    expect(second).toEqual({ outcome: 'not-found' });
  });

  it("returns not-found for another tenant's token", async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    const subscriber = await insertSubscriber(tenantOneId);

    const result = await unsubscribeByToken(
      tenantTwoId,
      subscriber.unsubscribeToken,
    );

    expect(result).toEqual({ outcome: 'not-found' });

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, subscriber.id));
    expect(rows).toHaveLength(1);
  });

  it("does not remove another subscriber's row", async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const subscriber = await insertSubscriber(tenantId, {
      email: 'reader@example.com',
    });
    const other = await insertSubscriber(tenantId, {
      email: 'other@example.com',
    });

    await unsubscribeByToken(tenantId, subscriber.unsubscribeToken);

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, other.id));
    expect(rows).toHaveLength(1);
  });
});
