'use client';

import type { TMaybeUndefined } from '@blog/config';
import { createContext, useContext, type ReactNode } from 'react';

const PoweredByMarkContext = createContext<TMaybeUndefined<string>>(undefined);

type TPoweredByMarkProviderProps = {
  productName: TMaybeUndefined<string>;
  children: ReactNode;
};

/** Names the product in a site preview's "Powered by" mark; no name means the previewed plan draws none. */
export const PoweredByMarkProvider = ({
  productName,
  children,
}: TPoweredByMarkProviderProps) => (
  <PoweredByMarkContext.Provider value={productName}>
    {children}
  </PoweredByMarkContext.Provider>
);

export const usePoweredByProductName = (): TMaybeUndefined<string> =>
  useContext(PoweredByMarkContext);
