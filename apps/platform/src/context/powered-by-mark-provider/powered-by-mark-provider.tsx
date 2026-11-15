'use client';

import type { IWithChildren } from '@blog/config/react';
import { createContext, useContext } from 'react';

const PoweredByMarkContext = createContext(false);

type TPoweredByMarkProviderProps = IWithChildren & {
  hasPoweredByMark: boolean;
};

export const PoweredByMarkProvider = ({
  hasPoweredByMark,
  children,
}: TPoweredByMarkProviderProps) => (
  <PoweredByMarkContext.Provider value={hasPoweredByMark}>
    {children}
  </PoweredByMarkContext.Provider>
);

export const useHasPoweredByMark = (): boolean =>
  useContext(PoweredByMarkContext);
