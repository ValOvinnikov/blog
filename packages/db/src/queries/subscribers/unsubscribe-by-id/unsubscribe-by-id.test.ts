import { SUBSCRIBER_OUTCOME } from '@blog/config';
import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { unsubscribeById } from './unsubscribe-by-id';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

async function insertSubscriber(
  tenantId: string,
  email: string = MOCK_SUBSCRIBER_EMAIL,
): Promise<schema.TSubscriber> {
  const [inserted] = await db()
    .insert(schema.subscribers)
    .values({ tenantId, email })
    .returning();
  if (!inserted) throw new Error('failed to seed a subscriber row');
  return inserted;
}

async function countRows(id: string): Promise<number> {
  const rows = await db()
    .select()
    .from(schema.subscribers)
    .where(eq(schema.subscribers.id, id));
  return rows.length;
}

describe(unsubscribeById, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('deletes the subscriber row', async () => {
    const subscriber = await insertSubscriber(tenantId);

    const result = await unsubscribeById(tenantId, subscriber.id);

    expect(result).toEqual({
      ...toOutcome(SUBSCRIBER_OUTCOME.UNSUBSCRIBED),
      subscriber,
    });
    expect(await countRows(subscriber.id)).toBe(0);
  });

  it('returns not-found for an unknown subscriber', async () => {
    const result = await unsubscribeById(tenantId, faker.string.uuid());

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND));
  });

  it("returns not-found for another tenant's subscriber and keeps the row", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const subscriber = await insertSubscriber(otherTenantId);

    const result = await unsubscribeById(tenantId, subscriber.id);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND));
    expect(await countRows(subscriber.id)).toBe(1);
  });

  it("does not remove another subscriber's row", async () => {
    const subscriber = await insertSubscriber(tenantId);
    const other = await insertSubscriber(tenantId, faker.internet.email());

    await unsubscribeById(tenantId, subscriber.id);

    expect(await countRows(other.id)).toBe(1);
  });
});
