import { EMAIL_TYPE } from '@shinefold/config/constants';
import { SUBSCRIBER_BAND_CEILINGS } from '@shinefold/db/constants';
import { countEmailSendsThisMonth } from '@shinefold/db/queries/email-usage';
import { countActiveSubscribers } from '@shinefold/db/queries/subscribers';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { monthlySendAllowance } from '@shinefold/db/utils/monthly-send-allowance/monthly-send-allowance';
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
