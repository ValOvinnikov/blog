import type { TBillingInterval } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import type { TBillingCurrency } from '@shinefold/db/constants';
import { listStripePrices } from '@shinefold/db/queries/stripe-catalogue';
import type { TTenant } from '@shinefold/db/schema/tenants';
import {
  bandMoveUpFor,
  type TBandMoveUp,
} from '@shinefold/db/utils/band-price/band-price';
import { sanitizeLogMessage } from '@shinefold/insight';
import { NEWSLETTER_SEND_LOG } from '@worker/constants/newsletter-send';
import { logger } from '@worker/utils/logger/logger';

export type TNewsletterMoveUpOffer = TBandMoveUp & {
  interval: TBillingInterval;
  currency: TBillingCurrency;
};

export async function readNewsletterMoveUpOffer({
  id: tenantId,
  plan,
  subscriberBandCeiling,
  billingInterval,
  billingCurrency,
}: TTenant): Promise<TMaybeUndefined<TNewsletterMoveUpOffer>> {
  if (!billingInterval || !billingCurrency) return undefined;

  try {
    const moveUp = bandMoveUpFor(
      await listStripePrices(),
      { plan, interval: billingInterval, currency: billingCurrency },
      subscriberBandCeiling,
    );
    return (
      moveUp && {
        ...moveUp,
        interval: billingInterval,
        currency: billingCurrency,
      }
    );
  } catch (error) {
    logger.error(NEWSLETTER_SEND_LOG.MOVE_UP_PRICE_FAILED, {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    return undefined;
  }
}
