export type TStripeCall = (...args: unknown[]) => Promise<unknown>;

export const stripeCall = (value: unknown) =>
  vi.fn<TStripeCall>(async () => value);
