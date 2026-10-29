'use client';

import { SIZE } from '@blog/config';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { Spinner } from '@platform/components/shared/spinner';
import type { TTenantsListQuery } from '@platform/utils/tenants-list-query/tenants-list-query';
import { useTenantsListNavigation } from '@platform/utils/use-tenants-list-navigation/use-tenants-list-navigation';
import { useTranslations } from 'next-intl';
import { useOptimistic } from 'react';

import { archivedTenantsToggleVariants } from './archived-tenants-toggle-variants';

export type TArchivedTenantsToggleProps = {
  listQuery: TTenantsListQuery;
};

type TTenantVisibility = 'active' | 'all';

export const ArchivedTenantsToggle = ({
  listQuery,
}: TArchivedTenantsToggleProps) => {
  const t = useTranslations('archivedTenantsToggle');
  const { isPending, navigate } = useTenantsListNavigation(listQuery);
  const [value, setOptimisticValue] = useOptimistic<TTenantVisibility>(
    listQuery.shouldShowArchived ? 'all' : 'active',
  );
  const { root } = archivedTenantsToggleVariants();

  const handleChange = (next: TTenantVisibility) => {
    navigate({ shouldShowArchived: next === 'all' }, () =>
      setOptimisticValue(next),
    );
  };

  return (
    <div className={root()}>
      {isPending && <Spinner label={t('loading')} size={SIZE.SM} />}
      <SegmentedControl<TTenantVisibility>
        ariaLabel={t('ariaLabel')}
        options={[
          { value: 'active', label: t('activeOption') },
          { value: 'all', label: t('allOption') },
        ]}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};
