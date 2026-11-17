import 'server-only';

import {
  BILLING_LOG,
  STRIPE_LIVE_SUBSCRIPTION_STATUSES,
} from '@platform/constants/billing';
import { SUBSCRIPTION_LIFECYCLE_LOG } from '@platform/constants/subscription-lifecycle';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isOneOf } from '@shinefold/utils/primitives';

import { getStripeClient } from './stripe-client';

/** Undefined when Stripe could not be asked, which a caller treats as neither answer. */
export const hasLiveStripeSubscription = async ({
  id: tenantId,
  stripeCustomerId: customer,
}: Pick<TTenant, 'id' | 'stripeCustomerId'>): Promise<
  TMaybeUndefined<boolean>
> => {
  if (!customer) return false;
  const stripe = getStripeClient();
  if (!stripe) {
    logger.error(BILLING_LOG.STRIPE_UNCONFIGURED, { tenantId });
    return undefined;
  }

  try {
    for await (const { status } of stripe.subscriptions.list({ customer })) {
      if (isOneOf(STRIPE_LIVE_SUBSCRIPTION_STATUSES, status)) return true;
    }
    return false;
  } catch (error) {
    logger.error(SUBSCRIPTION_LIFECYCLE_LOG.LIVE_CHECK_FAILED, {
      tenantId,
      ...toLoggableError(error),
    });
    return undefined;
  }
};
