import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { mintSubscriberTokens } from '@blog/db/utils/subscriber-tokens/subscriber-tokens';
import { eq } from 'drizzle-orm';

import { confirmSubscriber } from './confirm-subscriber';

const EXPECTED_CONFIRMED = 'expected confirmed';
const ALREADY_CONFIRMED = 'already-confirmed';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

async function insertPendingSubscriber(
  tenantId: string,
): Promise<schema.TSubscriber & { confirmationToken: string }> {
  const { tokens, hashes } = mintSubscriberTokens();
  const [inserted] = await db()
    .insert(schema.subscribers)
    .values({ tenantId, email: 'reader@example.com', ...hashes })
    .returning();

  if (!inserted) throw new Error('failed to seed a subscriber row');

  return { ...inserted, confirmationToken: tokens.confirmationToken };
}

describe(confirmSubscriber, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('flips a pending subscriber to active and stamps confirmedAt', async () => {
    const pending = await insertPendingSubscriber(tenantId);

    const result = await confirmSubscriber(tenantId, pending.confirmationToken);

    expect(result.outcome).toBe('confirmed');
    if (result.outcome !== 'confirmed') throw new Error(EXPECTED_CONFIRMED);
    expect(result.subscriber.status).toBe('active');
    expect(result.subscriber.confirmedAt).not.toBeNull();

    const [row] = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, pending.id));
    expect(row?.status).toBe('active');
  });

  it('is idempotent-safe: confirming an already-active row again does not error or restamp confirmedAt', async () => {
    const pending = await insertPendingSubscriber(tenantId);
    const first = await confirmSubscriber(tenantId, pending.confirmationToken);
    if (first.outcome !== 'confirmed') throw new Error(EXPECTED_CONFIRMED);

    const second = await confirmSubscriber(tenantId, pending.confirmationToken);

    expect(second).toEqual({
      outcome: ALREADY_CONFIRMED,
      subscriber: first.subscriber,
    });
  });

  it('returns not-found for an unrecognized token', async () => {
    const result = await confirmSubscriber(tenantId, 'does-not-exist');

    expect(result).toEqual({ outcome: 'not-found' });
  });

  it('returns not-found when given the stored hash instead of the token', async () => {
    const pending = await insertPendingSubscriber(tenantId);

    const result = await confirmSubscriber(
      tenantId,
      pending.confirmationTokenHash,
    );

    expect(result).toEqual({ outcome: 'not-found' });
  });

  it("returns not-found for another tenant's token", async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    const pending = await insertPendingSubscriber(tenantOneId);

    const result = await confirmSubscriber(
      tenantTwoId,
      pending.confirmationToken,
    );

    expect(result).toEqual({ outcome: 'not-found' });
  });

  it('resolves two concurrent confirms of the same token into exactly one confirmed outcome', async () => {
    const pending = await insertPendingSubscriber(tenantId);

    const [first, second] = await Promise.all([
      confirmSubscriber(tenantId, pending.confirmationToken),
      confirmSubscriber(tenantId, pending.confirmationToken),
    ]);

    const outcomes = [first.outcome, second.outcome].sort();
    expect(outcomes).toEqual([ALREADY_CONFIRMED, 'confirmed']);

    const confirmed = first.outcome === 'confirmed' ? first : second;
    if (confirmed.outcome !== 'confirmed') {
      throw new Error('expected one confirmed outcome');
    }
    const [row] = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, pending.id));
    expect(row?.confirmedAt).toEqual(confirmed.subscriber.confirmedAt);
  });
});
