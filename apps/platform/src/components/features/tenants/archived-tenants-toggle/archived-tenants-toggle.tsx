'use client';

import { SIZE } from '@blog/config';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { Spinner } from '@platform/components/shared/spinner';
import {
  TENANT_VISIBILITY,
  type TTenantVisibility,
} from '@platform/constants/tenant';
import type { TTenantsListQuery } from '@platform/utils/tenants-list-query/tenants-list-query';
import { useTenantsListNavigation } from '@platform/utils/use-tenants-list-navigation/use-tenants-list-navigation';
import { useTranslations } from 'next-intl';
import { useOptimistic } from 'react';

import { archivedTenantsToggleVariants } from './archived-tenants-toggle-variants';

export type TArchivedTenantsToggleProps = {
  listQuery: TTenantsListQuery;
};

export const ArchivedTenantsToggle = ({
  listQuery,
}: TArchivedTenantsToggleProps) => {
  const t = useTranslations('archivedTenantsToggle');
  const { isPending, navigate } = useTenantsListNavigation(listQuery);
  const [value, setOptimisticValue] = useOptimistic<TTenantVisibility>(
    listQuery.shouldShowArchived
      ? TENANT_VISIBILITY.ALL
      : TENANT_VISIBILITY.ACTIVE,
  );
  const { root } = archivedTenantsToggleVariants();

  const handleChange = (next: TTenantVisibility) => {
    navigate({ shouldShowArchived: next === TENANT_VISIBILITY.ALL }, () =>
      setOptimisticValue(next),
    );
  };

  return (
    <div className={root()}>
      {isPending && <Spinner label={t('loading')} size={SIZE.SM} />}
      <SegmentedControl<TTenantVisibility>
        aria={{ label: t('ariaLabel') }}
        options={[
          { value: TENANT_VISIBILITY.ACTIVE, label: t('activeOption') },
          { value: TENANT_VISIBILITY.ALL, label: t('allOption') },
        ]}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};
