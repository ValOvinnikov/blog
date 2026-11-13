import { EMAIL_TYPE } from '@blog/config/constants';
import { SUBSCRIBER_BAND_CEILINGS } from '@blog/db/constants';
import { countEmailSendsThisMonth } from '@blog/db/queries/email-usage';
import { countActiveSubscribers } from '@blog/db/queries/subscribers';
import type { TTenant } from '@blog/db/schema/tenants';
import { monthlySendAllowance } from '@blog/db/utils/monthly-send-allowance/monthly-send-allowance';
import type { TNewsletterLimits } from '@worker/utils/newsletter-send/newsletter-limits';

export async function readNewsletterLimits({
  id,
  plan,
  subscriberBandCeiling,
}: TTenant): Promise<TNewsletterLimits> {
  const bandCeiling = subscriberBandCeiling ?? SUBSCRIBER_BAND_CEILINGS[0];
  const [activeCount, sentThisMonth] = await Promise.all([
    countActiveSubscribers(id),
    countEmailSendsThisMonth(id, EMAIL_TYPE.NEWSLETTER_ISSUE),
  ]);

  return {
    activeCount,
    bandCeiling,
    allowance: monthlySendAllowance(plan, bandCeiling),
    sentThisMonth,
  };
}
