import {
  EMAIL_DELIVERY_OUTCOME,
  EMAIL_REPUTATION_WINDOW_DAYS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  insertTestEmailDeliveryOutcomeCount,
  MOCK_TODAY,
} from '@blog/db/testing/email-usage/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { useTestTenant } from '@blog/db/testing/test-tenant';
import { utcDayDaysBefore } from '@blog/db/utils/utc-day/utc-day';

import { getEmailReputation } from './get-email-reputation';

vi.mock('@blog/db/client');

const OLDEST_DAY_IN_WINDOW = utcDayDaysBefore(
  MOCK_NOW,
  EMAIL_REPUTATION_WINDOW_DAYS - 1,
);
const DAY_BEFORE_WINDOW = utcDayDaysBefore(
  MOCK_NOW,
  EMAIL_REPUTATION_WINDOW_DAYS,
);

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.emailDeliveryOutcomeCounts);
});

describe(getEmailReputation, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it('reports no outcomes and zero rates for a tenant with none', async () => {
    const reputation = await getEmailReputation(tenantId);

    expect(reputation).toEqual({
      resolvedCount: 0,
      bounceRate: 0,
      complaintRate: 0,
    });
  });

  it('rates bounces and complaints against delivered plus bounced emails in the window', async () => {
    await insertTestEmailDeliveryOutcomeCount(
      db(),
      tenantId,
      EMAIL_DELIVERY_OUTCOME.DELIVERED,
      MOCK_TODAY,
      30,
    );
    await insertTestEmailDeliveryOutcomeCount(
      db(),
      tenantId,
      EMAIL_DELIVERY_OUTCOME.DELIVERED,
      OLDEST_DAY_IN_WINDOW,
      15,
    );
    await insertTestEmailDeliveryOutcomeCount(
      db(),
      tenantId,
      EMAIL_DELIVERY_OUTCOME.BOUNCED,
      MOCK_TODAY,
      5,
    );
    await insertTestEmailDeliveryOutcomeCount(
      db(),
      tenantId,
      EMAIL_DELIVERY_OUTCOME.COMPLAINED,
      OLDEST_DAY_IN_WINDOW,
      2,
    );

    const reputation = await getEmailReputation(tenantId);

    expect(reputation).toEqual({
      resolvedCount: 50,
      bounceRate: 0.1,
      complaintRate: 0.04,
    });
  });

  it("ignores outcomes before the window and another tenant's outcomes", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestEmailDeliveryOutcomeCount(
      db(),
      tenantId,
      EMAIL_DELIVERY_OUTCOME.BOUNCED,
      DAY_BEFORE_WINDOW,
      9,
    );
    await insertTestEmailDeliveryOutcomeCount(
      db(),
      otherTenantId,
      EMAIL_DELIVERY_OUTCOME.BOUNCED,
      MOCK_TODAY,
      9,
    );

    const reputation = await getEmailReputation(tenantId);

    expect(reputation.resolvedCount).toBe(0);
  });
});
