'use client';

import type { TMaybeUndefined } from '@shinefold/config';
import { isUndefined } from '@shinefold/utils/primitives';
import { createContext, useContext, type ReactNode } from 'react';

const SanityImageBaseUrlContext =
  createContext<TMaybeUndefined<string>>(undefined);

export interface ISanityImageBaseUrlProviderProps {
  baseUrl: string;
  children: ReactNode;
}

export const SanityImageBaseUrlProvider = ({
  baseUrl,
  children,
}: ISanityImageBaseUrlProviderProps) => (
  <SanityImageBaseUrlContext.Provider value={baseUrl}>
    {children}
  </SanityImageBaseUrlContext.Provider>
);

export const useSanityImageBaseUrl = (): string => {
  const context = useContext(SanityImageBaseUrlContext);
  if (isUndefined(context)) {
    throw new Error(
      'useSanityImageBaseUrl must be used within a SanityImageBaseUrlProvider',
    );
  }
  return context;
};
