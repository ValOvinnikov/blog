import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  NEWSLETTER_SKIP_REASON,
} from '@blog/db/constants';
import { mockNewsletterLimits } from '@worker/testing/newsletter-send/fixtures';

import { nearLimitNotices, newsletterSkipReason } from './newsletter-limits';

describe(newsletterSkipReason, () => {
  it('allows a send that fits the band and the rest of the month’s allowance', () => {
    expect(
      newsletterSkipReason(
        mockNewsletterLimits({ activeCount: 1_000, sentThisMonth: 5_000 }),
      ),
    ).toBeUndefined();
  });

  it('skips a site with more subscribers than its band', () => {
    expect(
      newsletterSkipReason(mockNewsletterLimits({ activeCount: 1_001 })),
    ).toBe(NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND);
  });

  it('skips a send that would pass the month’s allowance', () => {
    expect(
      newsletterSkipReason(
        mockNewsletterLimits({ activeCount: 500, sentThisMonth: 5_501 }),
      ),
    ).toBe(NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE);
  });
});

describe(nearLimitNotices, () => {
  it('owes no notice below 80% of either limit', () => {
    expect(
      nearLimitNotices(
        mockNewsletterLimits({ activeCount: 799, sentThisMonth: 0 }),
      ),
    ).toEqual([]);
  });

  it('owes a band notice from 80% of the band', () => {
    expect(
      nearLimitNotices(mockNewsletterLimits({ activeCount: 800 })),
    ).toEqual([NEWSLETTER_LIMIT_NOTICE_KIND.SUBSCRIBER_BAND_NEAR]);
  });

  it('owes an allowance notice once this send reaches 80% of the allowance', () => {
    expect(
      nearLimitNotices(
        mockNewsletterLimits({ activeCount: 100, sentThisMonth: 4_700 }),
      ),
    ).toEqual([NEWSLETTER_LIMIT_NOTICE_KIND.MONTHLY_ALLOWANCE_NEAR]);
  });
});
