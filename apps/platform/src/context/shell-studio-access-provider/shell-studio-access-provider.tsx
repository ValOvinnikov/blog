'use client';

import type { TMaybeUndefined } from '@shinefold/config';
import type { TStudioAccess } from '@shinefold/config/constants';
import { createContext, useContext, type ReactNode } from 'react';

const ShellStudioAccessContext =
  createContext<TMaybeUndefined<TStudioAccess>>(undefined);

type TShellStudioAccessProviderProps = {
  studioAccess: TMaybeUndefined<TStudioAccess>;
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

export const useShellStudioAccess = (): TMaybeUndefined<TStudioAccess> =>
  useContext(ShellStudioAccessContext);
