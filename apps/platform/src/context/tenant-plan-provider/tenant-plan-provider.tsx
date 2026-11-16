'use client';

import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenantPlan } from '@shinefold/config/constants';
import type { IWithChildren } from '@shinefold/config/react';
import { createContext, useContext } from 'react';

const TenantPlanContext =
  createContext<TMaybeUndefined<TTenantPlan>>(undefined);

type TTenantPlanProviderProps = IWithChildren & {
  plan: TTenantPlan;
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
