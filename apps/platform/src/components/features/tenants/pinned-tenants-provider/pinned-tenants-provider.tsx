'use client';

import { useToast } from '@platform/context/toast-provider';
import { setTenantPinAction } from '@platform/server/tenants/set-tenant-pin-action';
import {
  applyPinChange,
  type TPinnedTenant,
} from '@platform/utils/pinned-tenants/pinned-tenants';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { isOutcomeSuccess, type TMaybeUndefined } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import { useTranslations } from 'next-intl';
import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  useTransition,
} from 'react';

import { pinnedTenantsProviderVariants } from './pinned-tenants-provider-variants';

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
  const [announcement, setAnnouncement] = useState('');
  const { liveRegion } = pinnedTenantsProviderVariants();

  const setPinned = (tenant: TPinnedTenant, isPinned: boolean) => {
    const { id, name } = tenant;
    startTransition(async () => {
      applyOptimisticChange({ tenant, isPinned });
      const result = await settleAction(setTenantPinAction(id, isPinned));

      if (isOutcomeSuccess(result)) {
        setAnnouncement(
          t(isPinned ? 'pinnedAnnouncement' : 'unpinnedAnnouncement', { name }),
        );
        return;
      }
      toast.error({ message: t('saveFailed', { name }) });
    });
  };

  return (
    <PinnedTenantsContext.Provider
      value={{ pinnedTenants: optimisticPinned, setPinned }}
    >
      {children}
      <span role="status" className={liveRegion()}>
        {announcement}
      </span>
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
