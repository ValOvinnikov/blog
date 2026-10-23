import { SUBSCRIBER_OUTCOME } from '@blog/config';
import * as schema from '@blog/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
  TEST_SUBSCRIBER_EMAIL,
  TEST_SUBSCRIBER_TAGGED_EMAIL,
} from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';

import { unsubscribeById } from './unsubscribe-by-id';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
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
      TEST_SUBSCRIBER_EMAIL,
    ));
  });

  it('deletes only the named subscriber', async () => {
    const { id: siblingId } = await insertTestSubscriber(
      db(),
      tenantId,
      TEST_SUBSCRIBER_TAGGED_EMAIL,
    );

    const result = await unsubscribeById(tenantId, subscriberId);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.UNSUBSCRIBED));
    expect(await readSubscriberIds()).toEqual([siblingId]);
  });

  it.each([
    ['an unknown subscriber', () => tenantId, () => faker.string.uuid()],
    ["another tenant's subscriber", () => otherTenantId, () => subscriberId],
  ])(
    'returns not-found for %s and deletes nothing',
    async (_case, tenant, id) => {
      const result = await unsubscribeById(tenant(), id());

      expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND));
      expect(await readSubscriberIds()).toEqual([subscriberId]);
    },
  );
});
