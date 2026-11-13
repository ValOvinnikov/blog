import {
  NEWSLETTER_LIMIT_NOTICE_KIND,
  NEWSLETTER_SKIP_REASON,
} from '@blog/db/constants';
import { mockNewsletterLimits } from '@worker/testing/newsletter-send/fixtures';

import {
  nearLimitNotices,
  newsletterSkipReason,
  sentAfterThisPost,
} from './newsletter-limits';

const { SUBSCRIBER_BAND_NEAR, MONTHLY_ALLOWANCE_NEAR } =
  NEWSLETTER_LIMIT_NOTICE_KIND;

describe(newsletterSkipReason, () => {
  it.each([
    ['allows a send within the band and allowance', 1_000, 5_000, undefined],
    [
      'skips a site with more subscribers than its band',
      1_001,
      0,
      NEWSLETTER_SKIP_REASON.OVER_SUBSCRIBER_BAND,
    ],
    [
      'skips a send that would pass the allowance',
      500,
      5_501,
      NEWSLETTER_SKIP_REASON.OVER_MONTHLY_ALLOWANCE,
    ],
  ])('%s', (_, activeCount, sentThisMonth, reason) => {
    expect(
      newsletterSkipReason(
        mockNewsletterLimits({ activeCount, sentThisMonth }),
      ),
    ).toBe(reason);
  });
});

describe(nearLimitNotices, () => {
  it.each([
    ['owes none below 80% of either limit', 799, 0, []],
    ['owes a band notice from 80% of the band', 800, 0, [SUBSCRIBER_BAND_NEAR]],
    [
      'owes an allowance notice once this send reaches 80% of it',
      100,
      4_700,
      [MONTHLY_ALLOWANCE_NEAR],
    ],
  ])('%s', (_, activeCount, sentThisMonth, notices) => {
    expect(
      nearLimitNotices(mockNewsletterLimits({ activeCount, sentThisMonth })),
    ).toEqual(notices);
  });
});

describe(sentAfterThisPost, () => {
  it('adds this post’s sends to the month’s', () => {
    expect(
      sentAfterThisPost(
        mockNewsletterLimits({ activeCount: 300, sentThisMonth: 1_200 }),
      ),
    ).toBe(1_500);
  });
});
