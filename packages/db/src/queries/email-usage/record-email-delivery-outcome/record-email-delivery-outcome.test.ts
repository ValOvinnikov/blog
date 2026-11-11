import { EMAIL_DELIVERY_OUTCOME } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_DELIVERY_EVENT_IDS,
  MOCK_TODAY,
  readEmailDeliveryOutcomeCounts,
} from '@blog/db/testing/email-usage/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { recordEmailDeliveryOutcome } from './record-email-delivery-outcome';

vi.mock('@blog/db/client');

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

    expect([first, repeat]).toEqual([true, false]);
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
});
