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

import { listSubscribersPage } from './list-subscribers-page';

vi.mock('@shinefold/db/client');

faker.seed(77061);

const MOCK_PAGE_SIZE = 2;
const MOCK_CONFIRMED = Array.from({ length: 3 }, (_, index) => ({
  email: faker.internet.email().toLowerCase(),
  confirmedAt: new Date(MOCK_NOW.getTime() - index * 60_000),
}));

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.subscribers);
});

describe(listSubscribersPage, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it("pages confirmed subscribers newest first with the site's total", async () => {
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

    const firstPage = await listSubscribersPage(tenantId, {
      page: 1,
      pageSize: MOCK_PAGE_SIZE,
    });
    const secondPage = await listSubscribersPage(tenantId, {
      page: 2,
      pageSize: MOCK_PAGE_SIZE,
    });

    expect(firstPage).toEqual({
      rows: confirmed.slice(0, MOCK_PAGE_SIZE),
      total: confirmed.length,
    });
    expect(secondPage).toEqual({
      rows: confirmed.slice(MOCK_PAGE_SIZE),
      total: confirmed.length,
    });
  });

  it('returns no rows and a zero total for a site with no confirmed subscribers', async () => {
    await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_EMAIL);

    expect(
      await listSubscribersPage(tenantId, {
        page: 1,
        pageSize: MOCK_PAGE_SIZE,
      }),
    ).toEqual({ rows: [], total: 0 });
  });
});
