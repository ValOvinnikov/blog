import { type ReactNode, useEffect } from 'react';

export const EMBEDDED_CHECKOUT_TEST_ID = 'embedded-checkout';

type TFakeProviderProps = {
  children: ReactNode;
  options: { fetchClientSecret: () => Promise<string> };
};

export const EmbeddedCheckoutProvider = ({
  children,
  options,
}: TFakeProviderProps) => {
  useEffect(() => {
    options.fetchClientSecret().catch(() => undefined);
  }, [options]);

  return children;
};

export const EmbeddedCheckout = () => (
  <div data-testid={EMBEDDED_CHECKOUT_TEST_ID} />
);
