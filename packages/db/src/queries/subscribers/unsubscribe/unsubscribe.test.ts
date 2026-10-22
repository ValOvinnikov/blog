import * as schema from '@blog/db/schema';
import {
  insertTestReader,
  insertTestSubscriber,
  insertTestTenant,
  insertTestUser,
  TEST_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { unsubscribe } from './unsubscribe';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

async function countSubscribers(tenantId: string): Promise<number> {
  const rows = await db()
    .select()
    .from(schema.subscribers)
    .where(eq(schema.subscribers.tenantId, tenantId));
  return rows.length;
}

describe(unsubscribe, () => {
  let userId: string;
  let tenantId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestReader(db(), TEST_SUBSCRIBER_EMAIL));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('deletes the subscriber row matching the account email', async () => {
    await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_EMAIL);

    await unsubscribe(tenantId, userId);

    expect(await countSubscribers(tenantId)).toBe(0);
  });

  it('is a no-op when no subscriber row matches the account email', async () => {
    await expect(unsubscribe(tenantId, userId)).resolves.toBeUndefined();
  });

  it('is a no-op for an unrecognized userId', async () => {
    await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_EMAIL);

    await unsubscribe(tenantId, faker.string.uuid());

    expect(await countSubscribers(tenantId)).toBe(1);
  });

  it('is a no-op when the user has no email on file', async () => {
    const { id } = await insertTestUser(db());
    await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_EMAIL);

    await unsubscribe(tenantId, id);

    expect(await countSubscribers(tenantId)).toBe(1);
  });

  it("does not remove another user's subscriber row", async () => {
    await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_EMAIL);
    const other = await insertTestSubscriber(
      db(),
      tenantId,
      faker.internet.email().toLowerCase(),
    );

    await unsubscribe(tenantId, userId);

    const rows = await db().select().from(schema.subscribers);
    expect(rows.map(({ id }) => id)).toEqual([other.id]);
  });

  it("does not remove another tenant's subscriber row for the same email", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_EMAIL);
    await insertTestSubscriber(db(), otherTenantId, TEST_SUBSCRIBER_EMAIL);

    await unsubscribe(tenantId, userId);

    expect(await countSubscribers(otherTenantId)).toBe(1);
  });

  it('keeps a subscriber row whose address differs only by a +tag', async () => {
    const [localPart, domain] = TEST_SUBSCRIBER_EMAIL.split('@');
    await insertTestSubscriber(db(), tenantId, `${localPart}+news@${domain}`);

    await unsubscribe(tenantId, userId);

    expect(await countSubscribers(tenantId)).toBe(1);
  });
});
