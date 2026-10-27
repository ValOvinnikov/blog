import { SUBSCRIBER_OUTCOME } from '@blog/config';
import * as schema from '@blog/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
  MOCK_SUBSCRIBER_TAGGED_EMAIL,
} from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';

import { unsubscribeById } from './unsubscribe-by-id';

vi.mock('@blog/db/client');

faker.seed(1);

const MOCK_UNKNOWN_SUBSCRIBER_ID = faker.string.uuid();

const db = useQueryTestDb();
usePersonalDataKeys();

async function readSubscriberIds(): Promise<string[]> {
  const rows = await db().select().from(schema.subscribers);
  return rows.map(({ id }) => id).sort();
}

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
    const remainingIds = await readSubscriberIds();

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
      const remainingIds = await readSubscriberIds();

      expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND));
      expect(remainingIds).toEqual([subscriberId]);
    },
  );
});
