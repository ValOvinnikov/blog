import type { TSubscribersPageData } from '@platform/server/subscribers/load-subscribers-page';
import { createMockFaker } from '@platform/testing/mock-faker';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { toSubscriberLimits } from '@platform/utils/subscriber-limits/subscriber-limits';
import { TENANT_PLAN } from '@shinefold/config';
import type { TNewsletterLimits } from '@shinefold/db/queries/email-usage';
import type { TConfirmedSubscriber } from '@shinefold/db/queries/subscribers/confirmed-subscribers';
import type { TTenant } from '@shinefold/db/schema/tenants';

const subscribersFaker = createMockFaker(7164);

export const MOCK_SUBSCRIBERS_BAND_CEILING = 1_000;
export const MOCK_SUBSCRIBERS_NEXT_BAND = 2_500;
export const MOCK_SUBSCRIBERS_ALLOWANCE = 6_000;
export const MOCK_SUBSCRIBER_COUNT = 300;
export const MOCK_SENT_THIS_MONTH = 900;
export const MOCK_BAND_NEAR_COUNT = 850;
export const MOCK_BAND_OVER_COUNT = 1_040;
export const MOCK_EMAILS_NEAR_SENT = 5_000;
export const MOCK_EMAILS_OUT_SENT = 5_800;

export const MOCK_CONFIRMED_AT = new Date('2026-11-03T09:15:00.000Z');
export const MOCK_EXPORTED_DAY = '2026-11-22';
export const MOCK_EXPORTED_AT = new Date(`${MOCK_EXPORTED_DAY}T12:00:00.000Z`);

export const MOCK_SUBSCRIBERS_LIMITS: TNewsletterLimits = {
  activeCount: MOCK_SUBSCRIBER_COUNT,
  bandCeiling: MOCK_SUBSCRIBERS_BAND_CEILING,
  allowance: MOCK_SUBSCRIBERS_ALLOWANCE,
  sentThisMonth: MOCK_SENT_THIS_MONTH,
};

export const MOCK_SUBSCRIBER_EMAIL = subscribersFaker.internet.email();

export const mockConfirmedSubscriber = (
  overrides: Partial<TConfirmedSubscriber> = {},
): TConfirmedSubscriber => ({
  id: subscribersFaker.string.uuid(),
  email: subscribersFaker.internet.email(),
  confirmedAt: MOCK_CONFIRMED_AT,
  ...overrides,
});

export const MOCK_SUBSCRIBER = mockConfirmedSubscriber({
  email: MOCK_SUBSCRIBER_EMAIL,
});

export const mockSubscribersPageData = (
  overrides: Partial<TSubscribersPageData> = {},
  limits: Partial<TNewsletterLimits> = {},
): TSubscribersPageData => {
  const rows = [MOCK_SUBSCRIBER, mockConfirmedSubscriber()];

  return {
    ...toSubscriberLimits({
      limits: { ...MOCK_SUBSCRIBERS_LIMITS, ...limits },
      isOperatorPaused: false,
      hasMovedUp: false,
    }),
    list: { rows, total: rows.length },
    page: 1,
    pageHref: adminRoutes.dashboardSubscribers,
    totalPages: 1,
    emailNewPosts: true,
    pausedAt: undefined,
    nextBand: MOCK_SUBSCRIBERS_NEXT_BAND,
    offer: undefined,
    skippedPost: undefined,
    ...overrides,
  };
};

export const mockPlatformNewsletterTenant = (
  overrides: Partial<TTenant> = {},
) =>
  mockReadyTenant({
    plan: TENANT_PLAN.GROWTH,
    createdFromPlatform: true,
    ...overrides,
  });
