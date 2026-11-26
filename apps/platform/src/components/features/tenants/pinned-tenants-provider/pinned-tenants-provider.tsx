'use client';

import { useToast } from '@platform/context/toast-provider';
import { pinTenantAction } from '@platform/server/tenants/pin-tenant-action';
import { unpinTenantAction } from '@platform/server/tenants/unpin-tenant-action';
import {
  applyPinChange,
  type TPinnedTenant,
} from '@platform/utils/pinned-tenants/pinned-tenants';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { isOutcomeSuccess, type TMaybeUndefined } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import { useTranslations } from 'next-intl';
import { createContext, useContext, useOptimistic, useTransition } from 'react';

type TPinnedTenantsContext = {
  pinnedTenants: TPinnedTenant[];
  setPinned: (tenant: TPinnedTenant, isPinned: boolean) => void;
};

export type TPinnedTenantsProviderProps = IWithChildren & {
  pinnedTenants: TPinnedTenant[];
};

const PinnedTenantsContext =
  createContext<TMaybeUndefined<TPinnedTenantsContext>>(undefined);

export const PinnedTenantsProvider = ({
  pinnedTenants,
  children,
}: TPinnedTenantsProviderProps) => {
  const t = useTranslations('pinnedTenants');
  const toast = useToast();
  const [optimisticPinned, applyOptimisticChange] = useOptimistic(
    pinnedTenants,
    applyPinChange,
  );
  const [, startTransition] = useTransition();

  const setPinned = (tenant: TPinnedTenant, isPinned: boolean) => {
    startTransition(async () => {
      applyOptimisticChange({ tenant, isPinned });
      const result = await settleAction(
        isPinned ? pinTenantAction(tenant.id) : unpinTenantAction(tenant.id),
      );

      if (!isOutcomeSuccess(result)) {
        toast.error({ message: t('saveFailed', { name: tenant.name }) });
      }
    });
  };

  return (
    <PinnedTenantsContext.Provider
      value={{ pinnedTenants: optimisticPinned, setPinned }}
    >
      {children}
    </PinnedTenantsContext.Provider>
  );
};

export const usePinnedTenants = (): TPinnedTenantsContext => {
  const context = useContext(PinnedTenantsContext);
  if (!context) {
    throw new Error(
      'usePinnedTenants must be used within a PinnedTenantsProvider',
    );
  }
  return context;
};
