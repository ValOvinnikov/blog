'use client';

import type { TMaybeUndefined } from '@blog/config';
import { createContext, useContext, type ReactNode } from 'react';

const LeadsTenantContext = createContext<TMaybeUndefined<string>>(undefined);

export type TLeadsTenantProviderProps = {
  tenantId: string;
  children: ReactNode;
};

export const LeadsTenantProvider = ({
  tenantId,
  children,
}: TLeadsTenantProviderProps) => (
  <LeadsTenantContext.Provider value={tenantId}>
    {children}
  </LeadsTenantContext.Provider>
);

export const useLeadsTenantId = (): string => {
  const tenantId = useContext(LeadsTenantContext);
  if (!tenantId) {
    throw new Error('useLeadsTenantId must be used within LeadsTenantProvider');
  }
  return tenantId;
};
