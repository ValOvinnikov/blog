import type { TMaybeUndefined } from '@blog/config';
import type Stripe from 'stripe';

export const getStripeClient = vi.fn((): TMaybeUndefined<Stripe> => undefined);
