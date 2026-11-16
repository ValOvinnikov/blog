import { faker } from '@faker-js/faker';
import { SUBSCRIBER_OUTCOME } from '@shinefold/config';
import * as schema from '@shinefold/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
  MOCK_SUBSCRIBER_TAGGED_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { readSubscriberIds } from '@shinefold/db/testing/subscribers/fixtures';
import { toOutcome } from '@shinefold/utils/to-outcome';

import { unsubscribeById } from './unsubscribe-by-id';

vi.mock('@shinefold/db/client');

faker.seed(1);

const MOCK_UNKNOWN_SUBSCRIBER_ID = faker.string.uuid();

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(unsubscribeById, () => {
  let tenantId: string;
  let otherTenantId: string;
  let subscriberId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    ({ id: otherTenantId } = await insertTestTenant(db()));
    ({ id: subscriberId } = await insertTestSubscriber(
      db(),
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    ));
  });

  it('deletes only the named subscriber', async () => {
    const { id: siblingId } = await insertTestSubscriber(
      db(),
      tenantId,
      MOCK_SUBSCRIBER_TAGGED_EMAIL,
    );

    const result = await unsubscribeById(tenantId, subscriberId);
    const remainingIds = await readSubscriberIds(db());

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.UNSUBSCRIBED));
    expect(remainingIds).toEqual([siblingId]);
  });

  it.each([
    ['an unknown subscriber', () => tenantId, () => MOCK_UNKNOWN_SUBSCRIBER_ID],
    ["another tenant's subscriber", () => otherTenantId, () => subscriberId],
  ])(
    'returns not-found for %s and deletes nothing',
    async (_case, tenant, id) => {
      const result = await unsubscribeById(tenant(), id());
      const remainingIds = await readSubscriberIds(db());

      expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND));
      expect(remainingIds).toEqual([subscriberId]);
    },
  );
});
