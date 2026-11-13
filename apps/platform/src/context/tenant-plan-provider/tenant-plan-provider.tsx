'use client';

import type { TMaybeUndefined } from '@blog/config';
import type { TTenantPlan } from '@blog/config/constants';
import { createContext, useContext, type ReactNode } from 'react';

const TenantPlanContext =
  createContext<TMaybeUndefined<TTenantPlan>>(undefined);

type TTenantPlanProviderProps = {
  plan: TTenantPlan;
  children: ReactNode;
};

/** Carries the plan the tenant's page was rendered with; a `router.refresh()` replaces it with the current one. */
export const TenantPlanProvider = ({
  plan,
  children,
}: TTenantPlanProviderProps) => (
  <TenantPlanContext.Provider value={plan}>
    {children}
  </TenantPlanContext.Provider>
);

export const useTenantPlan = (): TMaybeUndefined<TTenantPlan> =>
  useContext(TenantPlanContext);
