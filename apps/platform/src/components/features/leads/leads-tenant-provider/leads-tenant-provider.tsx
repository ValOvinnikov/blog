'use client';

import type { TMaybeUndefined } from '@blog/config';
import { createContext, useContext, useState, type ReactNode } from 'react';

type TPageTitleCache = Map<string, Promise<TMaybeUndefined<string>>>;

type TLeadsTenantContext = {
  tenantId: string;
  pageTitles: TPageTitleCache;
};

const LeadsTenantContext =
  createContext<TMaybeUndefined<TLeadsTenantContext>>(undefined);

export type TLeadsTenantProviderProps = {
  tenantId: string;
  children: ReactNode;
};

export const LeadsTenantProvider = ({
  tenantId,
  children,
}: TLeadsTenantProviderProps) => {
  const [pageTitles] = useState<TPageTitleCache>(() => new Map());

  return (
    <LeadsTenantContext.Provider value={{ tenantId, pageTitles }}>
      {children}
    </LeadsTenantContext.Provider>
  );
};

const useLeadsTenantContext = (): TLeadsTenantContext => {
  const context = useContext(LeadsTenantContext);
  if (!context) {
    throw new Error('useLeadsTenantId must be used within LeadsTenantProvider');
  }
  return context;
};

export const useLeadsTenantId = (): string => useLeadsTenantContext().tenantId;

export const useLeadPageTitleCache = (): TPageTitleCache =>
  useLeadsTenantContext().pageTitles;
