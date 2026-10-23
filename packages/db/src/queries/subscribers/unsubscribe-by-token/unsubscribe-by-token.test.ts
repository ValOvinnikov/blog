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
import { sha256Hex } from '@blog/utils/hash';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';

import { unsubscribeByToken } from './unsubscribe-by-token';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const UNSUBSCRIBE_TOKEN = faker.string.uuid();
const UNSUBSCRIBE_TOKEN_HASH = sha256Hex(UNSUBSCRIBE_TOKEN);

async function readSubscriberIds(): Promise<string[]> {
  const rows = await db().select().from(schema.subscribers);
  return rows.map(({ id }) => id).sort();
}

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(unsubscribeByToken, () => {
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
      { unsubscribeTokenHash: UNSUBSCRIBE_TOKEN_HASH },
    ));
  });

  it('deletes only the subscriber the token belongs to', async () => {
    const { id: siblingId } = await insertTestSubscriber(
      db(),
      tenantId,
      TEST_SUBSCRIBER_TAGGED_EMAIL,
    );

    const result = await unsubscribeByToken(tenantId, UNSUBSCRIBE_TOKEN);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.UNSUBSCRIBED));
    expect(await readSubscriberIds()).toEqual([siblingId]);
  });

  it.each([
    ['an unknown token', () => tenantId, () => faker.string.uuid()],
    ['the stored hash', () => tenantId, () => UNSUBSCRIBE_TOKEN_HASH],
    ["another tenant's token", () => otherTenantId, () => UNSUBSCRIBE_TOKEN],
  ])(
    'returns not-found for %s and deletes nothing',
    async (_case, tenant, token) => {
      const result = await unsubscribeByToken(tenant(), token());

      expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND));
      expect(await readSubscriberIds()).toEqual([subscriberId]);
    },
  );
});
