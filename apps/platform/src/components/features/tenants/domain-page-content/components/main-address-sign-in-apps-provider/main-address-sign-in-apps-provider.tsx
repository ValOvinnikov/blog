'use client';

import type { TOAuthProvider } from '@blog/config/constants';
import { createContext, use, type ReactNode } from 'react';

const MainAddressSignInAppsContext = createContext<readonly TOAuthProvider[]>(
  [],
);

export type TMainAddressSignInAppsProviderProps = {
  providers: readonly TOAuthProvider[];
  children: ReactNode;
};

export const MainAddressSignInAppsProvider = ({
  providers,
  children,
}: TMainAddressSignInAppsProviderProps) => (
  <MainAddressSignInAppsContext value={providers}>
    {children}
  </MainAddressSignInAppsContext>
);

export const useMainAddressSignInApps = () => use(MainAddressSignInAppsContext);
