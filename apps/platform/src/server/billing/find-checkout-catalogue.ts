import 'server-only';

import { BILLING_LOG } from '@platform/constants/billing';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import type { TMaybeUndefined } from '@shinefold/config';
import {
  type TTenantPlan,
  type TBillingInterval,
} from '@shinefold/config/constants';
import { PLAN_PRICE_LOOKUP_KEYS } from '@shinefold/db/constants';
import { lookupKeyFor } from '@shinefold/db/utils/price-lookup-key/price-lookup-key';
import type Stripe from 'stripe';

export type TPromoContext = { tenantId: string; promo?: string };

export const findPlanPrice = async (
  stripe: Stripe,
  plan: TTenantPlan,
  interval: TBillingInterval,
): Promise<TMaybeUndefined<Stripe.Price>> => {
  const keys = PLAN_PRICE_LOOKUP_KEYS[plan];
  if (!keys) return undefined;
  const { data } = await stripe.prices.list({
    lookup_keys: [lookupKeyFor(keys, interval)],
    active: true,
    limit: 1,
  });
  return data[0];
};

export const findPromotionCodeId = async (
  stripe: Stripe,
  { tenantId, promo }: TPromoContext,
): Promise<TMaybeUndefined<string>> => {
  if (!promo) return undefined;
  try {
    const { data } = await stripe.promotionCodes.list({
      code: promo,
      active: true,
      limit: 1,
    });
    return data[0]?.id;
  } catch (error) {
    logger.warn(BILLING_LOG.CHECKOUT_PROMO_REFUSED, {
      tenantId,
      promo,
      ...toLoggableError(error),
    });
    return undefined;
  }
};
