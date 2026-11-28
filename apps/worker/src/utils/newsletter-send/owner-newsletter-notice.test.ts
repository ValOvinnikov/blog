import {
  BILLING_INTERVAL,
  EMAIL_ACCOUNT,
  LOCALE_ISO_CODES,
  NEWSLETTER_SKIP_REASON,
  TENANT_PLAN,
} from '@shinefold/config/constants';
import {
  BILLING_CURRENCY,
  NEWSLETTER_LIMIT_NOTICE_KIND,
  STRIPE_PRICE_LOOKUP_KEY,
} from '@shinefold/db/constants';
import { getTenantOwnerEmail } from '@shinefold/db/queries/memberships';
import {
  markNewsletterLimitNoticeSent,
  releaseNewsletterLimitNotice,
} from '@shinefold/db/queries/newsletter-post-sends';
import { listStripePrices } from '@shinefold/db/queries/stripe-catalogue';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { mockStripePrice } from '@shinefold/db/testing/stripe-catalogue/fixtures';
import { sendEmail } from '@shinefold/email';
import { NEWSLETTER_SEND_LOG } from '@worker/constants/newsletter-send';
import { OWNER_SUBSCRIBERS_PATH } from '@worker/constants/owner-email';
import {
  MOCK_NEWSLETTER_POST,
  MOCK_PAUSED_AT,
  mockNewsletterLimits,
} from '@worker/testing/newsletter-send/fixtures';
import { MOCK_RESEND_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_OWNER_EMAIL } from '@worker/testing/owner-access/fixtures';
import { MOCK_PLATFORM_APP_BASE_URL } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_TENANT_ID, mockTenant } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';

import {
  sendOwnerNewsletterNotice,
  sendOwnerReputationPauseNotice,
} from './owner-newsletter-notice';

vi.mock('@shinefold/db/queries/memberships');
vi.mock('@shinefold/db/queries/newsletter-post-sends');
vi.mock('@shinefold/db/queries/stripe-catalogue');
vi.mock('@shinefold/email/transport/send-email');
vi.mock('@worker/utils/env/env');

const {
  SENDING_PAUSED,
  SUBSCRIBER_BAND_NEAR,
  MONTHLY_ALLOWANCE_NEAR,
  REPUTATION_PAUSED,
} = NEWSLETTER_LIMIT_NOTICE_KIND;
const MOCK_LIMITS = mockNewsletterLimits({
  activeCount: 2_001,
  bandCeiling: 2_500,
  allowance: 15_000,
  sentThisMonth: 4_321,
});
const MOCK_BAND_PAUSE = {
  skipReason: NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND,
  postTitle: MOCK_NEWSLETTER_POST.title,
};
const MOCK_MONTHLY_EXTRA = '20.00';
const MOCK_YEARLY_EXTRA = '200.00';

const MOCK_BAND_PRICES = [
  mockStripePrice({
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_25000,
    currency: BILLING_CURRENCY.EUR,
    unitAmount: 9_900,
  }),
  mockStripePrice({
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500,
    currency: BILLING_CURRENCY.EUR,
    unitAmount: 1_500,
  }),
  mockStripePrice({
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_5000,
    currency: BILLING_CURRENCY.EUR,
    unitAmount: 3_500,
  }),
  mockStripePrice({
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_2500_YEARLY,
    currency: BILLING_CURRENCY.EUR,
    unitAmount: 15_000,
  }),
  mockStripePrice({
    lookupKey: STRIPE_PRICE_LOOKUP_KEY.GROWTH_BAND_5000_YEARLY,
    currency: BILLING_CURRENCY.EUR,
    unitAmount: 35_000,
  }),
];

function mockGrowthTenant(overrides: Partial<TTenant> = {}): TTenant {
  return mockTenant({
    plan: TENANT_PLAN.GROWTH,
    subscriberBandCeiling: 2_500,
    billingInterval: BILLING_INTERVAL.MONTHLY,
    billingCurrency: BILLING_CURRENCY.EUR,
    ...overrides,
  });
}

function sentEmail() {
  return vi.mocked(sendEmail).mock.calls[0]?.[0];
}

beforeEach(() => {
  mockEnv.PLATFORM_APP_BASE_URL = MOCK_PLATFORM_APP_BASE_URL;
  vi.mocked(markNewsletterLimitNoticeSent).mockResolvedValue(true);
  vi.mocked(getTenantOwnerEmail).mockResolvedValue(MOCK_OWNER_EMAIL);
});

describe(sendOwnerNewsletterNotice, () => {
  beforeEach(() => {
    vi.mocked(listStripePrices).mockResolvedValue(MOCK_BAND_PRICES);
  });

  it('emails the owner from the platform account, linking to Subscribers', async () => {
    await sendOwnerNewsletterNotice(
      mockGrowthTenant(),
      SUBSCRIBER_BAND_NEAR,
      MOCK_LIMITS,
    );

    expect(markNewsletterLimitNoticeSent).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      SUBSCRIBER_BAND_NEAR,
      { since: undefined },
    );
    expect(sentEmail()).toMatchObject({
      account: EMAIL_ACCOUNT.PLATFORM,
      to: MOCK_OWNER_EMAIL,
    });
    expect(sentEmail()?.html).toContain(
      new URL(OWNER_SUBSCRIBERS_PATH, MOCK_PLATFORM_APP_BASE_URL).toString(),
    );
  });

  it.each([SUBSCRIBER_BAND_NEAR, MONTHLY_ALLOWANCE_NEAR])(
    'shows both limits’ usage in the %s email',
    async (kind) => {
      await sendOwnerNewsletterNotice(mockGrowthTenant(), kind, MOCK_LIMITS);

      expect(sentEmail()?.text).toContain('2,001');
      expect(sentEmail()?.text).toContain('6,322');
    },
  );

  it.each([
    [BILLING_INTERVAL.MONTHLY, MOCK_MONTHLY_EXTRA],
    [BILLING_INTERVAL.YEARLY, MOCK_YEARLY_EXTRA],
  ])(
    'prices the next band for a %s plan in the site’s currency',
    async (billingInterval, extra) => {
      await sendOwnerNewsletterNotice(
        mockGrowthTenant({ billingInterval }),
        SUBSCRIBER_BAND_NEAR,
        MOCK_LIMITS,
      );

      expect(sentEmail()?.text).toContain(`€${extra}`);
    },
  );

  it.each([
    ['on the largest band', { subscriberBandCeiling: 25_000 as const }],
    ['with no stored currency', { billingCurrency: null }],
    [
      'with no catalogue price in its currency',
      { billingCurrency: BILLING_CURRENCY.GBP },
    ],
  ])('offers no move-up to a site %s', async (_, overrides) => {
    await sendOwnerNewsletterNotice(
      mockGrowthTenant(overrides),
      SUBSCRIBER_BAND_NEAR,
      MOCK_LIMITS,
    );

    expect(sentEmail()?.text).not.toContain(MOCK_MONTHLY_EXTRA);
  });

  it('still sends the email, without a move-up, when the prices cannot be read', async () => {
    vi.mocked(listStripePrices).mockRejectedValue(new Error(MOCK_RESEND_DOWN));

    await sendOwnerNewsletterNotice(
      mockGrowthTenant(),
      SUBSCRIBER_BAND_NEAR,
      MOCK_LIMITS,
    );

    expect(sentEmail()?.text).not.toContain(MOCK_MONTHLY_EXTRA);
    expect(logger.error).toHaveBeenCalledWith(
      NEWSLETTER_SEND_LOG.MOVE_UP_PRICE_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_RESEND_DOWN },
    );
    expect(releaseNewsletterLimitNotice).not.toHaveBeenCalled();
  });

  it('names the skipped post in the paused email and shows only the limit it hit', async () => {
    await sendOwnerNewsletterNotice(
      mockGrowthTenant(),
      SENDING_PAUSED,
      MOCK_LIMITS,
      MOCK_BAND_PAUSE,
    );

    expect(sentEmail()?.text).toContain(MOCK_NEWSLETTER_POST.title);
    expect(sentEmail()?.text).toContain('2,001');
    expect(sentEmail()?.text).not.toContain('15,000');
  });

  it('shows the month’s usage in the paused email when the allowance ran out', async () => {
    await sendOwnerNewsletterNotice(
      mockGrowthTenant(),
      SENDING_PAUSED,
      MOCK_LIMITS,
      {
        skipReason: NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE,
        postTitle: MOCK_NEWSLETTER_POST.title,
      },
    );

    expect(sentEmail()?.text).toContain('4,321');
    expect(sentEmail()?.text).not.toContain('2,001');
  });

  it('writes numbers and prices the way the owner’s language does', async () => {
    await sendOwnerNewsletterNotice(
      mockGrowthTenant({ locale: LOCALE_ISO_CODES.DE }),
      SUBSCRIBER_BAND_NEAR,
      MOCK_LIMITS,
    );

    expect(sentEmail()?.text).toContain('2.001');
    expect(sentEmail()?.text).toMatch(/20,00\s€/);
  });

  it('switches language with the site', async () => {
    await sendOwnerNewsletterNotice(
      mockGrowthTenant({ locale: LOCALE_ISO_CODES.DE }),
      SENDING_PAUSED,
      MOCK_LIMITS,
      MOCK_BAND_PAUSE,
    );
    await sendOwnerNewsletterNotice(
      mockGrowthTenant(),
      SENDING_PAUSED,
      MOCK_LIMITS,
      MOCK_BAND_PAUSE,
    );

    const [german, english] = vi
      .mocked(sendEmail)
      .mock.calls.map(([input]) => input.subject);
    expect(german).not.toBe(english);
  });

  it('sends nothing when this month’s notice of that kind was already sent', async () => {
    vi.mocked(markNewsletterLimitNoticeSent).mockResolvedValue(false);

    await sendOwnerNewsletterNotice(
      mockGrowthTenant(),
      SENDING_PAUSED,
      MOCK_LIMITS,
      MOCK_BAND_PAUSE,
    );

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('gives the month’s notice back when the send fails, and logs it', async () => {
    vi.mocked(sendEmail).mockRejectedValue(new Error(MOCK_RESEND_DOWN));

    await sendOwnerNewsletterNotice(
      mockGrowthTenant(),
      SENDING_PAUSED,
      MOCK_LIMITS,
      MOCK_BAND_PAUSE,
    );

    expect(releaseNewsletterLimitNotice).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      SENDING_PAUSED,
    );
    expect(logger.error).toHaveBeenCalledWith(
      NEWSLETTER_SEND_LOG.OWNER_EMAIL_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        kind: SENDING_PAUSED,
        error: MOCK_RESEND_DOWN,
      },
    );
  });

  it('claims nothing when the site has no owner address', async () => {
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(undefined);

    await sendOwnerNewsletterNotice(
      mockGrowthTenant(),
      SENDING_PAUSED,
      MOCK_LIMITS,
      MOCK_BAND_PAUSE,
    );

    expect(markNewsletterLimitNoticeSent).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe(sendOwnerReputationPauseNotice, () => {
  it('claims this pause’s notice and emails the owner, linking to Subscribers', async () => {
    await sendOwnerReputationPauseNotice(mockGrowthTenant(), MOCK_PAUSED_AT);

    expect(markNewsletterLimitNoticeSent).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      REPUTATION_PAUSED,
      { since: MOCK_PAUSED_AT },
    );
    expect(sentEmail()).toMatchObject({
      account: EMAIL_ACCOUNT.PLATFORM,
      to: MOCK_OWNER_EMAIL,
    });
    expect(sentEmail()?.html).toContain(
      new URL(OWNER_SUBSCRIBERS_PATH, MOCK_PLATFORM_APP_BASE_URL).toString(),
    );
    expect(listStripePrices).not.toHaveBeenCalled();
  });

  it('writes a different email in every owner language', async () => {
    for (const locale of Object.values(LOCALE_ISO_CODES)) {
      await sendOwnerReputationPauseNotice(
        mockGrowthTenant({ locale }),
        MOCK_PAUSED_AT,
      );
    }

    const subjects = vi
      .mocked(sendEmail)
      .mock.calls.map(([input]) => input.subject);
    expect(new Set(subjects).size).toBe(Object.values(LOCALE_ISO_CODES).length);
  });

  it('sends nothing when this pause’s notice was already sent', async () => {
    vi.mocked(markNewsletterLimitNoticeSent).mockResolvedValue(false);

    await sendOwnerReputationPauseNotice(mockGrowthTenant(), MOCK_PAUSED_AT);

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('gives the notice back and logs when the send fails, without throwing', async () => {
    vi.mocked(sendEmail).mockRejectedValue(new Error(MOCK_RESEND_DOWN));

    await expect(
      sendOwnerReputationPauseNotice(mockGrowthTenant(), MOCK_PAUSED_AT),
    ).resolves.toBeUndefined();

    expect(releaseNewsletterLimitNotice).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      REPUTATION_PAUSED,
    );
    expect(logger.error).toHaveBeenCalledWith(
      NEWSLETTER_SEND_LOG.OWNER_EMAIL_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        kind: REPUTATION_PAUSED,
        error: MOCK_RESEND_DOWN,
      },
    );
  });

  it('logs and does not throw when the owner lookup fails', async () => {
    vi.mocked(getTenantOwnerEmail).mockRejectedValue(
      new Error(MOCK_RESEND_DOWN),
    );

    await expect(
      sendOwnerReputationPauseNotice(mockGrowthTenant(), MOCK_PAUSED_AT),
    ).resolves.toBeUndefined();

    expect(sendEmail).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      NEWSLETTER_SEND_LOG.OWNER_EMAIL_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        kind: REPUTATION_PAUSED,
        error: MOCK_RESEND_DOWN,
      },
    );
  });
});
