import { ArchivedTenantsToggle } from '@admin/components/features/tenants/archived-tenants-toggle';
import { TenantsTable } from '@admin/components/features/tenants/tenants-table';
import { LinkButton } from '@admin/components/shared/link-button';
import { PageHeader } from '@admin/components/shared/page-header';
import { adminRoutes } from '@admin/utils/routes/routes';
import type { TTenant } from '@blog/db/schema/tenants';
import { useTranslations } from 'next-intl';

import { tenantsViewVariants } from './tenants-view-variants';

export type TTenantsViewProps = {
  tenants: TTenant[];
  shouldShowArchived: boolean;
};

/**
 * The Tenants page body: heading, the add-tenant entry point, and the real
 * tenant list. Ships from day one — with one tenant it's still a finished
 * page, not a placeholder.
 */
export const TenantsView = ({
  tenants,
  shouldShowArchived,
}: TTenantsViewProps) => {
  const t = useTranslations('tenantsView');
  const { root, toolbar, codeChunk } = tenantsViewVariants();

  return (
    <div className={root()}>
      <PageHeader
        title={t('title')}
        description={t.rich('description', {
          code: (chunks) => <code className={codeChunk()}>{chunks}</code>,
        })}
        actions={
          <LinkButton href={adminRoutes.addTenant()} variant="primary">
            {t('addTenant')}
          </LinkButton>
        }
      />
      <div className={toolbar()}>
        <ArchivedTenantsToggle shouldShowArchived={shouldShowArchived} />
      </div>
      <TenantsTable tenants={tenants} />
    </div>
  );
};
