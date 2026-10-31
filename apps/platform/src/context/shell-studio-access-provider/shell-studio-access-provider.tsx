'use client';

import type { TMaybeUndefined } from '@blog/config';
import type { TOwnerStudioAccess } from '@platform/constants/owner-studio-access';
import { createContext, useContext, type ReactNode } from 'react';

const ShellStudioAccessContext =
  createContext<TMaybeUndefined<TOwnerStudioAccess>>(undefined);

type TShellStudioAccessProviderProps = {
  studioAccess: TMaybeUndefined<TOwnerStudioAccess>;
  children: ReactNode;
};

/** Carries the Studio access state the sidebar badge was rendered with, which the layout keeps across client navigations. */
export const ShellStudioAccessProvider = ({
  studioAccess,
  children,
}: TShellStudioAccessProviderProps) => (
  <ShellStudioAccessContext.Provider value={studioAccess}>
    {children}
  </ShellStudioAccessContext.Provider>
);

export const useShellStudioAccess = (): TMaybeUndefined<TOwnerStudioAccess> =>
  useContext(ShellStudioAccessContext);
