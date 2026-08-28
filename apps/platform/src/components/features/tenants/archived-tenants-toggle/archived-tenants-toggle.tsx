'use client';

import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useRouter } from '@platform/i18n/navigation';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

export type TArchivedTenantsToggleProps = {
  shouldShowArchived: boolean;
};

type TTenantVisibility = 'active' | 'all';

/**
 * `TenantsPage` re-fetches with `listTenants({ includeArchived })` on every
 * navigation, so this toggle only ever drives the `?archived=1` query param
 * — there is no client-side list to filter.
 */
export const ArchivedTenantsToggle = ({
  shouldShowArchived,
}: TArchivedTenantsToggleProps) => {
  const t = useTranslations('archivedTenantsToggle');
  const router = useRouter();

  const value: TTenantVisibility = shouldShowArchived ? 'all' : 'active';

  const handleChange = (next: TTenantVisibility) => {
    router.push(adminRoutes.tenants({ archived: next === 'all' }));
  };

  return (
    <SegmentedControl<TTenantVisibility>
      ariaLabel={t('ariaLabel')}
      options={[
        { value: 'active', label: t('activeOption') },
        { value: 'all', label: t('allOption') },
      ]}
      value={value}
      onChange={handleChange}
    />
  );
};
