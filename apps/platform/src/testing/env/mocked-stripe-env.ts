import { stripeEnv } from '@platform/utils/stripe-env/stripe-env';

export const mockedStripeEnv: Partial<Record<keyof typeof stripeEnv, string>> =
  stripeEnv;
