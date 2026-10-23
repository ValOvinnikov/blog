import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { sha256Hex } from '@blog/utils/hash';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { commitConfirmationToken } from './commit-confirmation-token';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(commitConfirmationToken, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  async function insertSubscriber(
    overrides: Partial<typeof schema.subscribers.$inferInsert> = {},
  ): Promise<schema.TSubscriber> {
    const [subscriber] = await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: MOCK_SUBSCRIBER_EMAIL, ...overrides })
      .returning();
    if (!subscriber) throw new Error('failed to seed a subscriber row');
    return subscriber;
  }

  async function readRow(id: string): Promise<schema.TSubscriber> {
    const [row] = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, id));
    if (!row) throw new Error('subscriber row missing');
    return row;
  }

  it('stores only the hash of the token', async () => {
    const { id } = await insertSubscriber();
    const confirmationToken = faker.string.uuid();

    await commitConfirmationToken(id, confirmationToken);

    expect((await readRow(id)).confirmationTokenHash).toBe(
      sha256Hex(confirmationToken),
    );
  });

  it('leaves the unsubscribe token hash untouched', async () => {
    const { id, unsubscribeTokenHash } = await insertSubscriber();

    await commitConfirmationToken(id, faker.string.uuid());

    expect((await readRow(id)).unsubscribeTokenHash).toBe(unsubscribeTokenHash);
  });

  it('never changes a subscriber who has confirmed', async () => {
    const subscriber = await insertSubscriber({ confirmedAt: new Date() });

    await commitConfirmationToken(subscriber.id, faker.string.uuid());

    expect(await readRow(subscriber.id)).toEqual(subscriber);
  });
});
