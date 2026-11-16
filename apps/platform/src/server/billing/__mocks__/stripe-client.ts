import type { TMaybeUndefined } from '@shinefold/config';
import type Stripe from 'stripe';

export const getStripeClient = vi.fn((): TMaybeUndefined<Stripe> => undefined);
