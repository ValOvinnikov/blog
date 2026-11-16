import * as schema from '@shinefold/db/schema';
import {
  insertTestReader,
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
  MOCK_SUBSCRIBER_TAGGED_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { unsubscribe } from './unsubscribe';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(unsubscribe, () => {
  let userId: string;
  let tenantId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestReader(db(), MOCK_SUBSCRIBER_EMAIL));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it("deletes only the account's own subscriber row", async () => {
    await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_EMAIL);
    const sibling = await insertTestSubscriber(
      db(),
      tenantId,
      MOCK_SUBSCRIBER_TAGGED_EMAIL,
    );

    await unsubscribe(tenantId, userId);

    const rows = await db().select().from(schema.subscribers);
    expect(rows.map(({ id }) => id)).toEqual([sibling.id]);
  });

  it('does nothing when the account has no subscription', async () => {
    await expect(unsubscribe(tenantId, userId)).resolves.toBeUndefined();
  });
});
