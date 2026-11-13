import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { type TTenantPlan } from '@blog/config/constants';
import { PLAN_PRICE_LOOKUP_KEYS } from '@blog/db/constants';
import {
  BILLING_INTERVAL,
  BILLING_LOG,
  type TBillingInterval,
} from '@platform/constants/billing';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import type Stripe from 'stripe';

export type TPromoContext = { tenantId: string; promo?: string };

export const findPlanPrice = async (
  stripe: Stripe,
  plan: TTenantPlan,
  interval: TBillingInterval,
): Promise<TMaybeUndefined<Stripe.Price>> => {
  const keys = PLAN_PRICE_LOOKUP_KEYS[plan];
  if (!keys) return undefined;
  const lookupKey =
    interval === BILLING_INTERVAL.YEARLY ? keys.yearly : keys.monthly;
  const { data } = await stripe.prices.list({
    lookup_keys: [lookupKey],
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
