import { ICONS } from '@blog/config';
import { ArchivedTenantsToggle } from '@platform/components/features/tenants/archived-tenants-toggle';
import { EmailAlertsBanner } from '@platform/components/features/tenants/email-alerts-banner';
import { TenantsSearch } from '@platform/components/features/tenants/tenants-search';
import { TenantsTable } from '@platform/components/features/tenants/tenants-table';
import { Icon } from '@platform/components/shared/icon';
import { LinkButton } from '@platform/components/shared/link-button';
import { PageHeader } from '@platform/components/shared/page-header';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TTenantsListQuery } from '@platform/utils/tenants-list-query/tenants-list-query';
import { useTranslations } from 'next-intl';

import { tenantsViewVariants } from './tenants-view-variants';

export type TTenantsViewProps = {
  tenants: TClientTenant[];
  listQuery: TTenantsListQuery;
  isEmailAlertingConfigured: boolean;
};

export const TenantsView = ({
  tenants,
  listQuery,
  isEmailAlertingConfigured,
}: TTenantsViewProps) => {
  const t = useTranslations('tenantsView');
  const { root } = tenantsViewVariants();

  return (
    <div className={root()}>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <LinkButton href={adminRoutes.newTenant()} variant="primary">
            <Icon name={ICONS.PLUS} />
            {t('addTenant')}
          </LinkButton>
        }
      />
      {!isEmailAlertingConfigured && <EmailAlertsBanner />}
      <TenantsTable
        tenants={tenants}
        listQuery={listQuery}
        toolbar={
          <>
            <TenantsSearch key={listQuery.search} listQuery={listQuery} />
            <ArchivedTenantsToggle listQuery={listQuery} />
          </>
        }
      />
    </div>
  );
};
