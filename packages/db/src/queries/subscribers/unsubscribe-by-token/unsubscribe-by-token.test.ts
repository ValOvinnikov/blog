import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { mintSubscriberTokens } from '@blog/db/utils/subscriber-tokens/subscriber-tokens';
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
): Promise<{ subscriber: schema.TSubscriber; unsubscribeToken: string }> {
  const { tokens, hashes } = mintSubscriberTokens();
  const [inserted] = await db()
    .insert(schema.subscribers)
    .values({ tenantId, email: 'reader@example.com', ...hashes, ...overrides })
    .returning();

  if (!inserted) throw new Error('failed to seed a subscriber row');

  return { subscriber: inserted, unsubscribeToken: tokens.unsubscribeToken };
}

describe(unsubscribeByToken, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('deletes the subscriber row matching the unsubscribe token', async () => {
    const { subscriber, unsubscribeToken } = await insertSubscriber(tenantId);

    const result = await unsubscribeByToken(tenantId, unsubscribeToken);

    expect(result).toEqual({ outcome: 'unsubscribed', subscriber });

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, subscriber.id));
    expect(rows).toHaveLength(0);
  });

  it('returns not-found for an unrecognized token', async () => {
    const result = await unsubscribeByToken(tenantId, 'does-not-exist');

    expect(result).toEqual({ outcome: 'not-found' });
  });

  it('treats the stored hash like an unknown token', async () => {
    const { subscriber } = await insertSubscriber(tenantId);

    const result = await unsubscribeByToken(
      tenantId,
      subscriber.unsubscribeTokenHash,
    );

    expect(result).toEqual(
      await unsubscribeByToken(tenantId, crypto.randomUUID()),
    );
  });

  it('returns not-found on a second use of the same token', async () => {
    const { subscriber, unsubscribeToken } = await insertSubscriber(tenantId);

    const first = await unsubscribeByToken(tenantId, unsubscribeToken);
    const second = await unsubscribeByToken(tenantId, unsubscribeToken);

    expect(first).toEqual({ outcome: 'unsubscribed', subscriber });
    expect(second).toEqual({ outcome: 'not-found' });
  });

  it("returns not-found for another tenant's token", async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    const { subscriber, unsubscribeToken } =
      await insertSubscriber(tenantOneId);

    const result = await unsubscribeByToken(tenantTwoId, unsubscribeToken);

    expect(result).toEqual({ outcome: 'not-found' });

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, subscriber.id));
    expect(rows).toHaveLength(1);
  });

  it("does not remove another subscriber's row", async () => {
    const { unsubscribeToken } = await insertSubscriber(tenantId);
    const { subscriber: other } = await insertSubscriber(tenantId, {
      email: 'other@example.com',
    });

    await unsubscribeByToken(tenantId, unsubscribeToken);

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, other.id));
    expect(rows).toHaveLength(1);
  });
});
