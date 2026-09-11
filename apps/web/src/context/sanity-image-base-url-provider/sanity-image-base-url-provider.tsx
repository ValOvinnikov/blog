'use client';

import { createContext, useContext, type ReactNode } from 'react';

const SanityImageBaseUrlContext = createContext<string | undefined>(undefined);

export interface ISanityImageBaseUrlProviderProps {
  baseUrl: string;
  children: ReactNode;
}

/**
 * SanityImageBaseUrlProvider — makes the current request's tenant Sanity CDN
 * base URL available to every `SanityImage` in the tree, resolved once per
 * request instead of once per image.
 *
 * @example
 * <SanityImageBaseUrlProvider baseUrl={getSanityImageBaseUrl(tenantContext)}>
 *   <App />
 * </SanityImageBaseUrlProvider>
 */
export const SanityImageBaseUrlProvider = ({
  baseUrl,
  children,
}: ISanityImageBaseUrlProviderProps) => (
  <SanityImageBaseUrlContext.Provider value={baseUrl}>
    {children}
  </SanityImageBaseUrlContext.Provider>
);

/** Reads the current tenant's Sanity CDN base URL — throws outside a SanityImageBaseUrlProvider. */
export const useSanityImageBaseUrl = (): string => {
  const context = useContext(SanityImageBaseUrlContext);
  if (context === undefined) {
    throw new Error(
      'useSanityImageBaseUrl must be used within a SanityImageBaseUrlProvider',
    );
  }
  return context;
};
