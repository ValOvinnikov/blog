import { faker } from '@faker-js/faker';
import * as schema from '@shinefold/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { mockConfirmedSubscriber } from '@shinefold/db/testing/subscribers/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { listSubscribersForExport } from './list-subscribers-for-export';

vi.mock('@shinefold/db/client');

faker.seed(77062);

const MOCK_BATCH_SIZE = 2;
const MOCK_CONFIRMED = Array.from({ length: 5 }, (_, index) => ({
  email: faker.internet.email().toLowerCase(),
  confirmedAt: new Date(MOCK_NOW.getTime() - Math.floor(index / 2) * 60_000),
}));

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.subscribers);
});

describe(listSubscribersForExport, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it("holds the site's confirmed subscribers newest first, across batches", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const confirmed = await Promise.all(
      MOCK_CONFIRMED.map(async ({ email, confirmedAt }) => {
        const { id } = await insertTestSubscriber(
          db(),
          tenantId,
          email,
          mockConfirmedSubscriber(confirmedAt),
        );
        return { id, email, confirmedAt };
      }),
    );
    await insertTestSubscriber(db(), tenantId, faker.internet.email());
    await insertTestSubscriber(
      db(),
      otherTenantId,
      MOCK_SUBSCRIBER_EMAIL,
      mockConfirmedSubscriber(MOCK_NOW),
    );
    const expected = [...confirmed]
      .sort(
        (a, b) =>
          b.confirmedAt.getTime() - a.confirmedAt.getTime() ||
          b.id.localeCompare(a.id),
      )
      .map(({ email, confirmedAt }) => ({ email, confirmedAt }));

    expect(await listSubscribersForExport(tenantId, MOCK_BATCH_SIZE)).toEqual(
      expected,
    );
  });

  it('returns none for a site with no confirmed subscribers', async () => {
    await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_EMAIL);

    expect(await listSubscribersForExport(tenantId)).toEqual([]);
  });
});
