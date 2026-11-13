import 'server-only';

import { isOneOf } from '@blog/utils/primitives';
import {
  STRIPE_CHECKOUT_SESSION_STATUS,
  STRIPE_LIVE_SUBSCRIPTION_STATUSES,
} from '@platform/constants/billing';
import type Stripe from 'stripe';

const STRIPE_LIST_LIMIT = 100;

export const hasLiveSubscription = async (
  stripe: Stripe,
  customer: string,
): Promise<boolean> => {
  const { data } = await stripe.subscriptions.list({
    customer,
    status: 'all',
    limit: STRIPE_LIST_LIMIT,
  });
  return data.some(({ status }) =>
    isOneOf(STRIPE_LIVE_SUBSCRIPTION_STATUSES, status),
  );
};

export const expireOpenCheckouts = async (
  stripe: Stripe,
  customer: string,
): Promise<void> => {
  const { data } = await stripe.checkout.sessions.list({
    customer,
    status: STRIPE_CHECKOUT_SESSION_STATUS.OPEN,
    limit: STRIPE_LIST_LIMIT,
  });
  await Promise.all(data.map(({ id }) => stripe.checkout.sessions.expire(id)));
};
