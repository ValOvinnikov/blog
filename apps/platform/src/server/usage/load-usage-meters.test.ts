import { USAGE_LOG, USAGE_METER } from '@platform/constants/usage';
import { mockEntitlementGrantRow } from '@platform/testing/tenants/entitlement-grants';
import { mockTenant } from '@platform/testing/tenants/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/tenant-identity';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import {
  CAPABILITY,
  LOCALE_ISO_CODES,
  TENANT_PLAN,
} from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import {
  ENTITLEMENT_KIND,
  PLAN_ENTITLEMENTS,
  SUBSCRIBER_BAND_CEILINGS,
} from '@shinefold/db/constants';

import { loadUsageMeters } from './load-usage-meters';

vi.mock('@shinefold/db', async () => ({
  queries: {
    takeawayGenerations: { countTakeawayGenerationsThisMonth: vi.fn() },
    emailUsage: { getNewsletterLimits: vi.fn() },
    membershipInvites: { countSeatsInUse: vi.fn() },
    tenants: {
      selectLiveLocalesWithin: (
        await import('@shinefold/db/queries/tenants/get-tenant-live-locales/get-tenant-live-locales')
      ).selectLiveLocalesWithin,
    },
  },
}));

const TAKEAWAYS_USED = 12;
const EMAILS_SENT = 4180;
const EMAIL_ALLOWANCE = 15000;
const SEATS_USED = 2;
const LANGUAGES_HREF = adminRoutes.languages(MOCK_TENANT_ID);
const MOCK_READ_ERROR = new Error('read failed');

const growthTenant = mockTenant({
  plan: TENANT_PLAN.GROWTH,
  additionalLocales: [LOCALE_ISO_CODES.DE],
});

describe(loadUsageMeters.name, () => {
  beforeEach(() => {
    vi.mocked(
      queries.takeawayGenerations.countTakeawayGenerationsThisMonth,
    ).mockResolvedValue(TAKEAWAYS_USED);
    vi.mocked(queries.emailUsage.getNewsletterLimits).mockResolvedValue({
      activeCount: 0,
      bandCeiling: SUBSCRIBER_BAND_CEILINGS[0],
      allowance: EMAIL_ALLOWANCE,
      sentThisMonth: EMAILS_SENT,
    });
    vi.mocked(queries.membershipInvites.countSeatsInUse).mockResolvedValue(
      SEATS_USED,
    );
  });

  it('shows only the takeaways row on a plan with no other allowance', async () => {
    const meters = await loadUsageMeters(mockTenant(), LANGUAGES_HREF);

    expect(meters).toEqual([
      {
        meter: USAGE_METER.TAKEAWAYS,
        reading: {
          used: TAKEAWAYS_USED,
          allowance: PLAN_ENTITLEMENTS[TENANT_PLAN.FREE].takeawaysPerMonth,
        },
        isMonthly: true,
        href: undefined,
        grant: undefined,
      },
    ]);
  });

  it('reads every meter the plan includes, in the card order', async () => {
    const meters = await loadUsageMeters(growthTenant, LANGUAGES_HREF);
    const { seats, takeawaysPerMonth } = PLAN_ENTITLEMENTS[TENANT_PLAN.GROWTH];

    expect(meters).toEqual([
      expect.objectContaining({
        meter: USAGE_METER.TAKEAWAYS,
        reading: { used: TAKEAWAYS_USED, allowance: takeawaysPerMonth },
      }),
      expect.objectContaining({
        meter: USAGE_METER.EMAILS,
        reading: { used: EMAILS_SENT, allowance: EMAIL_ALLOWANCE },
        href: undefined,
      }),
      expect.objectContaining({
        meter: USAGE_METER.SEATS,
        reading: { used: SEATS_USED, allowance: seats },
        isMonthly: false,
        href: undefined,
      }),
      expect.objectContaining({
        meter: USAGE_METER.LANGUAGES,
        reading: {
          used: growthTenant.additionalLocales.length,
          allowance: growthTenant.entitlements.localeLimit - 1,
        },
        href: LANGUAGES_HREF,
      }),
    ]);
  });

  it('shows the emails and languages rows a grant adds, with the grant', async () => {
    const tenant = mockTenant({ plan: TENANT_PLAN.FREE }, [
      mockEntitlementGrantRow({
        kind: ENTITLEMENT_KIND.CAPABILITY,
        key: CAPABILITY.NEWSLETTER,
        value: null,
        expiresAt: null,
        revokedAt: null,
      }),
      mockEntitlementGrantRow({
        kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
        key: ENTITLEMENT_KIND.LOCALE_LIMIT,
        value: 2,
        expiresAt: null,
        revokedAt: null,
      }),
    ]);

    const meters = await loadUsageMeters(tenant, LANGUAGES_HREF);

    expect(meters.map(({ meter, grant }) => ({ meter, grant }))).toEqual([
      { meter: USAGE_METER.TAKEAWAYS, grant: undefined },
      { meter: USAGE_METER.EMAILS, grant: { expiresAt: null } },
      { meter: USAGE_METER.LANGUAGES, grant: { expiresAt: null } },
    ]);
  });

  it('leaves a failed read without a reading and logs it, keeping the other rows', async () => {
    vi.mocked(queries.membershipInvites.countSeatsInUse).mockRejectedValue(
      MOCK_READ_ERROR,
    );

    const meters = await loadUsageMeters(growthTenant, LANGUAGES_HREF);

    expect(meters.map(({ meter, reading }) => [meter, reading])).toEqual([
      [USAGE_METER.TAKEAWAYS, expect.any(Object)],
      [USAGE_METER.EMAILS, expect.any(Object)],
      [USAGE_METER.SEATS, undefined],
      [USAGE_METER.LANGUAGES, expect.any(Object)],
    ]);
    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      USAGE_LOG.METER_READ_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        meter: USAGE_METER.SEATS,
        error: MOCK_READ_ERROR,
      },
    );
  });
});
