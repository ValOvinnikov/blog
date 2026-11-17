import 'server-only';

import {
  BILLING_LOG,
  STRIPE_SUBSCRIPTION_STATUS,
} from '@platform/constants/billing';
import {
  SUBSCRIPTION_LIFECYCLE_LOG,
  STRIPE_PAUSE_BEHAVIOR,
  STRIPE_UNSET_PARAM,
} from '@platform/constants/subscription-lifecycle';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TTenant } from '@shinefold/db/schema/tenants';
import Stripe from 'stripe';

import { getStripeClient } from './stripe-client';
import { hasStoredSubscription } from './upgrade-state-for';

type TSubscribedTenant = Pick<TTenant, 'id' | 'plan' | 'stripeSubscriptionId'>;

const liveSubscriptionIdOf = (
  tenant: TSubscribedTenant,
): TMaybeUndefined<string> =>
  hasStoredSubscription(tenant)
    ? (tenant.stripeSubscriptionId ?? undefined)
    : undefined;

const configuredStripe = (tenantId: string): TMaybeUndefined<Stripe> => {
  const stripe = getStripeClient();
  if (!stripe) logger.error(BILLING_LOG.STRIPE_UNCONFIGURED, { tenantId });
  return stripe;
};

export const setSubscriptionCollectionPaused = async (
  tenant: TSubscribedTenant,
  isPaused: boolean,
): Promise<void> => {
  const subscriptionId = liveSubscriptionIdOf(tenant);
  if (!subscriptionId) return;
  const stripe = configuredStripe(tenant.id);
  if (!stripe) return;

  try {
    await stripe.subscriptions.update(subscriptionId, {
      pause_collection: isPaused
        ? { behavior: STRIPE_PAUSE_BEHAVIOR.VOID }
        : STRIPE_UNSET_PARAM,
    });
  } catch (error) {
    logger.error(SUBSCRIPTION_LIFECYCLE_LOG.COLLECTION_FAILED, {
      tenantId: tenant.id,
      subscriptionId,
      isPaused,
      ...toLoggableError(error),
    });
  }
};

const cancelNow = async (stripe: Stripe, subscriptionId: string) => {
  try {
    await stripe.subscriptions.cancel(subscriptionId, { prorate: false });
  } catch (error) {
    if (!(error instanceof Stripe.errors.StripeInvalidRequestError))
      throw error;
    const { status } = await stripe.subscriptions.retrieve(subscriptionId);
    if (status !== STRIPE_SUBSCRIPTION_STATUS.CANCELED) throw error;
  }
};

const logCancelFailed = (
  tenantId: string,
  subscriptionId: string,
  cause: object,
) => {
  logger.error(SUBSCRIPTION_LIFECYCLE_LOG.CANCEL_FAILED, {
    tenantId,
    subscriptionId,
    ...cause,
  });
  return false;
};

export const cancelLiveSubscription = async (
  tenant: TSubscribedTenant,
): Promise<boolean> => {
  const subscriptionId = liveSubscriptionIdOf(tenant);
  if (!subscriptionId) return true;
  const stripe = configuredStripe(tenant.id);
  if (!stripe) return false;

  try {
    await cancelNow(stripe, subscriptionId);
    const freed = await queries.tenants.setCancelledTenantFree(
      tenant.id,
      subscriptionId,
    );
    return (
      freed.ok ||
      logCancelFailed(tenant.id, subscriptionId, { errorCode: freed.error })
    );
  } catch (error) {
    return logCancelFailed(tenant.id, subscriptionId, toLoggableError(error));
  }
};
