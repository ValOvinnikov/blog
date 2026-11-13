import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { BILLING_LOG } from '@platform/constants/billing';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import type Stripe from 'stripe';

import {
  loadSubscriptionPlan,
  type TSubscriptionPlan,
} from './load-subscription-plan';
import { getStripeClient } from './stripe-client';

export type TTenantSubscriptionPlan = {
  stripe: Stripe;
  subscription: TSubscriptionPlan;
};

export const readTenantSubscriptionPlan = async (
  tenantId: string,
  subscriptionId: string,
): Promise<TMaybeUndefined<TTenantSubscriptionPlan>> => {
  const stripe = getStripeClient();
  if (!stripe) {
    logger.error(BILLING_LOG.STRIPE_UNCONFIGURED, { tenantId });
    return undefined;
  }

  try {
    const subscription = await loadSubscriptionPlan(stripe, subscriptionId);
    if (!subscription) {
      logger.error(BILLING_LOG.PRICE_UNKNOWN, { tenantId, subscriptionId });
      return undefined;
    }
    return { stripe, subscription };
  } catch (error) {
    logger.error(BILLING_LOG.PLAN_CHANGE_LOAD_FAILED, {
      tenantId,
      subscriptionId,
      ...toLoggableError(error),
    });
    return undefined;
  }
};
