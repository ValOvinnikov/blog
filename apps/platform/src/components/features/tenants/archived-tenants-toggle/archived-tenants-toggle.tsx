'use client';

import { SIZE } from '@blog/config';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { Spinner } from '@platform/components/shared/spinner';
import { useRouter } from '@platform/i18n/navigation';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';
import { useOptimistic, useTransition } from 'react';

import { archivedTenantsToggleVariants } from './archived-tenants-toggle-variants';

export type TArchivedTenantsToggleProps = {
  shouldShowArchived: boolean;
};

type TTenantVisibility = 'active' | 'all';

export const ArchivedTenantsToggle = ({
  shouldShowArchived,
}: TArchivedTenantsToggleProps) => {
  const t = useTranslations('archivedTenantsToggle');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setOptimisticValue] = useOptimistic<TTenantVisibility>(
    shouldShowArchived ? 'all' : 'active',
  );
  const { root } = archivedTenantsToggleVariants();

  const handleChange = (next: TTenantVisibility) => {
    startTransition(() => {
      setOptimisticValue(next);
      router.push(adminRoutes.tenants({ archived: next === 'all' }));
    });
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
