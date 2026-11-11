import { EMAIL_DELIVERY_OUTCOME } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_TODAY,
  readEmailDeliveryOutcomeCounts,
} from '@blog/db/testing/email-usage/fixtures';
import { useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { recordEmailDeliveryOutcome } from './record-email-delivery-outcome';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.emailDeliveryOutcomeCounts);
});

describe(recordEmailDeliveryOutcome, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('counts each outcome against the tenant and the day', async () => {
    await recordEmailDeliveryOutcome(
      tenantId,
      EMAIL_DELIVERY_OUTCOME.DELIVERED,
    );
    await recordEmailDeliveryOutcome(
      tenantId,
      EMAIL_DELIVERY_OUTCOME.DELIVERED,
    );
    await recordEmailDeliveryOutcome(tenantId, EMAIL_DELIVERY_OUTCOME.BOUNCED);

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
          outcome: EMAIL_DELIVERY_OUTCOME.BOUNCED,
          count: 1,
        },
      ]),
    );
  });
});
