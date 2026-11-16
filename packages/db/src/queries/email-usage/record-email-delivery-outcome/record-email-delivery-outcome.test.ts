import { faker } from '@faker-js/faker';
import { ERROR_CODE } from '@shinefold/config/constants';
import { EMAIL_DELIVERY_OUTCOME } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import {
  MOCK_DELIVERY_EVENT_IDS,
  MOCK_TODAY,
  readEmailDeliveryOutcomeCounts,
} from '@shinefold/db/testing/email-usage/fixtures';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { errorResult, okResult } from '@shinefold/utils';

import { recordEmailDeliveryOutcome } from './record-email-delivery-outcome';

vi.mock('@shinefold/db/client');

faker.seed(7161);

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

const [FIRST_EVENT_ID, SECOND_EVENT_ID, THIRD_EVENT_ID] =
  MOCK_DELIVERY_EVENT_IDS;

afterEach(async () => {
  await db().delete(schema.emailDeliveryOutcomeCounts);
  await db().delete(schema.emailDeliveryEvents);
});

describe(recordEmailDeliveryOutcome, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('counts each outcome against the tenant and the day', async () => {
    await recordEmailDeliveryOutcome(
      FIRST_EVENT_ID,
      tenantId,
      EMAIL_DELIVERY_OUTCOME.DELIVERED,
    );
    await recordEmailDeliveryOutcome(
      SECOND_EVENT_ID,
      tenantId,
      EMAIL_DELIVERY_OUTCOME.DELIVERED,
    );
    await recordEmailDeliveryOutcome(
      THIRD_EVENT_ID,
      tenantId,
      EMAIL_DELIVERY_OUTCOME.COMPLAINED,
    );

    const rows = await readEmailDeliveryOutcomeCounts(db());
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        {
          tenantId,
          day: MOCK_TODAY,
          outcome: EMAIL_DELIVERY_OUTCOME.DELIVERED,
          count: 2,
        },
        {
          tenantId,
          day: MOCK_TODAY,
          outcome: EMAIL_DELIVERY_OUTCOME.COMPLAINED,
          count: 1,
        },
      ]),
    );
  });

  it('records a repeated event once', async () => {
    const first = await recordEmailDeliveryOutcome(
      FIRST_EVENT_ID,
      tenantId,
      EMAIL_DELIVERY_OUTCOME.BOUNCED,
    );
    const repeat = await recordEmailDeliveryOutcome(
      FIRST_EVENT_ID,
      tenantId,
      EMAIL_DELIVERY_OUTCOME.BOUNCED,
    );

    expect([first, repeat]).toEqual([okResult(true), okResult(false)]);
    const rows = await readEmailDeliveryOutcomeCounts(db());
    expect(rows.map(({ count }) => count)).toEqual([1]);
  });

  it("keeps another tenant's outcomes apart", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());

    await recordEmailDeliveryOutcome(
      FIRST_EVENT_ID,
      tenantId,
      EMAIL_DELIVERY_OUTCOME.DELIVERED,
    );
    await recordEmailDeliveryOutcome(
      SECOND_EVENT_ID,
      otherTenantId,
      EMAIL_DELIVERY_OUTCOME.DELIVERED,
    );

    const rows = await readEmailDeliveryOutcomeCounts(db());
    expect(rows.map(({ count }) => count)).toEqual([1, 1]);
  });

  it('reports a site this database does not hold as not found, storing nothing', async () => {
    const result = await recordEmailDeliveryOutcome(
      FIRST_EVENT_ID,
      faker.string.uuid(),
      EMAIL_DELIVERY_OUTCOME.DELIVERED,
    );

    expect(result).toEqual(errorResult(ERROR_CODE.DB_NOT_FOUND));
    expect(await readEmailDeliveryOutcomeCounts(db())).toEqual([]);
  });
});
