import { SUBSCRIBER_OUTCOME } from '@blog/config';
import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  TEST_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { sha256Hex } from '@blog/utils/hash';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';
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
  const unsubscribeToken = faker.string.uuid();
  const [inserted] = await db()
    .insert(schema.subscribers)
    .values({
      tenantId,
      email: TEST_SUBSCRIBER_EMAIL,
      unsubscribeTokenHash: sha256Hex(unsubscribeToken),
      ...overrides,
    })
    .returning();

  if (!inserted) throw new Error('failed to seed a subscriber row');

  return { subscriber: inserted, unsubscribeToken };
}

describe(unsubscribeByToken, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('deletes the subscriber row matching the unsubscribe token', async () => {
    const { subscriber, unsubscribeToken } = await insertSubscriber(tenantId);

    const result = await unsubscribeByToken(tenantId, unsubscribeToken);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.UNSUBSCRIBED));

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, subscriber.id));
    expect(rows).toHaveLength(0);
  });

  it('returns not-found for an unrecognized token', async () => {
    const result = await unsubscribeByToken(tenantId, faker.string.uuid());

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND));
  });

  it('treats the stored hash like an unknown token', async () => {
    const { subscriber } = await insertSubscriber(tenantId);

    const result = await unsubscribeByToken(
      tenantId,
      subscriber.unsubscribeTokenHash,
    );

    expect(result).toEqual(
      await unsubscribeByToken(tenantId, faker.string.uuid()),
    );
  });

  it('returns not-found on a second use of the same token', async () => {
    const { unsubscribeToken } = await insertSubscriber(tenantId);

    const first = await unsubscribeByToken(tenantId, unsubscribeToken);
    const second = await unsubscribeByToken(tenantId, unsubscribeToken);

    expect(first).toEqual(toOutcome(SUBSCRIBER_OUTCOME.UNSUBSCRIBED));
    expect(second).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND));
  });

  it("returns not-found for another tenant's token", async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    const { subscriber, unsubscribeToken } =
      await insertSubscriber(tenantOneId);

    const result = await unsubscribeByToken(tenantTwoId, unsubscribeToken);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND));

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, subscriber.id));
    expect(rows).toHaveLength(1);
  });

  it("does not remove another subscriber's row", async () => {
    const { unsubscribeToken } = await insertSubscriber(tenantId);
    const { subscriber: other } = await insertSubscriber(tenantId, {
      email: faker.internet.email(),
    });

    await unsubscribeByToken(tenantId, unsubscribeToken);

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, other.id));
    expect(rows).toHaveLength(1);
  });
});
