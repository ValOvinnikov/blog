'use client';

import type { IBusyStyle, TMaybeUndefined } from '@blog/config';
import { createContext, useContext, type ReactNode } from 'react';

const BusyStyleContext = createContext<TMaybeUndefined<IBusyStyle>>(undefined);

export interface IBusyStyleProviderProps {
  value: IBusyStyle;
  children: ReactNode;
}

export const BusyStyleProvider = ({
  value,
  children,
}: IBusyStyleProviderProps) => (
  <BusyStyleContext.Provider value={value}>
    {children}
  </BusyStyleContext.Provider>
);

/** Reads the site's busy-button style and spinner style — throws outside a `BusyStyleProvider`. */
export const useBusyStyle = (): IBusyStyle => {
  const context = useContext(BusyStyleContext);
  if (!context) {
    throw new Error('useBusyStyle must be used within a BusyStyleProvider');
  }
  return context;
};
