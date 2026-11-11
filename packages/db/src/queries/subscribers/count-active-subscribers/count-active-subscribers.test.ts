import * as schema from '@blog/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
  MOCK_SUBSCRIBER_TAGGED_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_ACTIVE_SUBSCRIBER } from '@blog/db/testing/subscribers/fixtures';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { countActiveSubscribers } from './count-active-subscribers';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.subscribers);
});

describe(countActiveSubscribers, () => {
  it("counts only the tenant's active subscribers", async () => {
    const { id: tenantId } = tenant();
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestSubscriber(
      db(),
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
      MOCK_ACTIVE_SUBSCRIBER,
    );
    await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_TAGGED_EMAIL);
    await insertTestSubscriber(
      db(),
      otherTenantId,
      MOCK_SUBSCRIBER_EMAIL,
      MOCK_ACTIVE_SUBSCRIBER,
    );

    const total = await countActiveSubscribers(tenantId);

    expect(total).toBe(1);
  });
});
