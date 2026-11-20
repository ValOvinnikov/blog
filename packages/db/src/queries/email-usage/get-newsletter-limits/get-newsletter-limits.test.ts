import {
  CAPABILITY,
  EMAIL_TYPE,
  TENANT_PLAN,
} from '@shinefold/config/constants';
import { PAID_SUBSCRIBER_BAND_CEILINGS } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  insertTestEmailSendCount,
  MOCK_LAST_MONTH_DAY,
  MOCK_TODAY,
} from '@shinefold/db/testing/email-usage/fixtures';
import {
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
  MOCK_SUBSCRIBER_TAGGED_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_ACTIVE_SUBSCRIBER } from '@shinefold/db/testing/subscribers/fixtures';
import {
  insertTestEntitlementGrant,
  useEntitlementGrantAdmin,
} from '@shinefold/db/testing/tenant-entitlement-grants/fixtures';

import { getNewsletterLimits } from './get-newsletter-limits';

vi.mock('@shinefold/db/client');

const [PAID_BAND] = PAID_SUBSCRIBER_BAND_CEILINGS;

const db = useQueryTestDb();
const admin = useEntitlementGrantAdmin(db);
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.emailSendCounts);
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(getNewsletterLimits, () => {
  it("reads the stored band, the allowance it buys and this month's post emails", async () => {
    const tenant = await insertTestTenant(db(), {
      plan: TENANT_PLAN.GROWTH,
      subscriberBandCeiling: PAID_BAND,
    });
    await insertTestSubscriber(
      db(),
      tenant.id,
      MOCK_SUBSCRIBER_EMAIL,
      MOCK_ACTIVE_SUBSCRIBER,
    );
    await insertTestSubscriber(db(), tenant.id, MOCK_SUBSCRIBER_TAGGED_EMAIL);
    await insertTestEmailSendCount(
      db(),
      tenant.id,
      EMAIL_TYPE.NEWSLETTER_ISSUE,
      MOCK_TODAY,
      40,
    );
    await insertTestEmailSendCount(
      db(),
      tenant.id,
      EMAIL_TYPE.NEWSLETTER_ISSUE,
      MOCK_LAST_MONTH_DAY,
      500,
    );
    await insertTestEmailSendCount(
      db(),
      tenant.id,
      EMAIL_TYPE.SIGN_IN,
      MOCK_TODAY,
      7,
    );

    expect(await getNewsletterLimits(tenant)).toEqual({
      activeCount: 1,
      bandCeiling: 2_500,
      allowance: 15_000,
      sentThisMonth: 40,
    });
  });

  it('uses the included band when no band is stored', async () => {
    const tenant = await insertTestTenant(db(), { plan: TENANT_PLAN.GROWTH });

    const { bandCeiling, allowance } = await getNewsletterLimits(tenant);

    expect({ bandCeiling, allowance }).toEqual({
      bandCeiling: 1_000,
      allowance: 6_000,
    });
  });

  describe.each([TENANT_PLAN.FREE, TENANT_PLAN.STARTER])('on %s', (plan) => {
    let tenant: TTenant;

    beforeEach(async () => {
      tenant = await insertTestTenant(db(), { plan });
    });

    it('allows no sends without a Newsletter grant', async () => {
      const { allowance } = await getNewsletterLimits(tenant);

      expect(allowance).toBe(0);
    });

    it("allows Growth's rate with a Newsletter grant", async () => {
      await insertTestEntitlementGrant(db(), tenant.id, {
        key: CAPABILITY.NEWSLETTER,
        grantedBy: admin(),
      });

      const { allowance } = await getNewsletterLimits(tenant);

      expect(allowance).toBe(6_000);
    });
  });
});
