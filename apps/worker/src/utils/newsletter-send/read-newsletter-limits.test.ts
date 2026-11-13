import { EMAIL_TYPE, TENANT_PLAN } from '@blog/config/constants';
import {
  PLAN_MONTHLY_SENDS_PER_SUBSCRIBER,
  SUBSCRIBER_BAND_CEILINGS,
} from '@blog/db/constants';
import { countEmailSendsThisMonth } from '@blog/db/queries/email-usage';
import { countActiveSubscribers } from '@blog/db/queries/subscribers';
import { MOCK_TENANT_ID, mockTenant } from '@worker/testing/tenant/fixtures';

import { readNewsletterLimits } from './read-newsletter-limits';

vi.mock('@blog/db/queries/email-usage');
vi.mock('@blog/db/queries/subscribers');

const [INCLUDED_BAND, PAID_BAND] = SUBSCRIBER_BAND_CEILINGS;
const MOCK_ACTIVE_COUNT = 700;
const MOCK_SENT_THIS_MONTH = 1_200;

describe(readNewsletterLimits, () => {
  beforeEach(() => {
    vi.mocked(countActiveSubscribers).mockResolvedValue(MOCK_ACTIVE_COUNT);
    vi.mocked(countEmailSendsThisMonth).mockResolvedValue(MOCK_SENT_THIS_MONTH);
  });

  it('reads the paid band and the allowance it buys, with this month’s post emails', async () => {
    const limits = await readNewsletterLimits(
      mockTenant({
        plan: TENANT_PLAN.GROWTH,
        subscriberBandCeiling: PAID_BAND,
      }),
    );

    expect(limits).toEqual({
      activeCount: MOCK_ACTIVE_COUNT,
      bandCeiling: PAID_BAND,
      allowance:
        PLAN_MONTHLY_SENDS_PER_SUBSCRIBER[TENANT_PLAN.GROWTH] * PAID_BAND,
      sentThisMonth: MOCK_SENT_THIS_MONTH,
    });
    expect(countEmailSendsThisMonth).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      EMAIL_TYPE.NEWSLETTER_ISSUE,
    );
  });

  it('uses the included band when no paid band is stored', async () => {
    const { bandCeiling } = await readNewsletterLimits(
      mockTenant({ plan: TENANT_PLAN.GROWTH }),
    );

    expect(bandCeiling).toBe(INCLUDED_BAND);
  });
});
