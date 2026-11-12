import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { stripeEnv } from '@platform/utils/stripe-env/stripe-env';
import Stripe from 'stripe';

let client: TMaybeUndefined<Stripe>;

export const getStripeClient = (): TMaybeUndefined<Stripe> => {
  const key = stripeEnv.STRIPE_SECRET_KEY;
  if (!key) return undefined;
  client ??= new Stripe(key);
  return client;
};
