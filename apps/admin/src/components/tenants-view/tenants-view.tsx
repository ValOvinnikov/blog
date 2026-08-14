import { TenantsTable } from '@admin/components/tenants-table';
import type { TTenant } from '@blog/db/schema/tenants';
import { Button } from '@blog/ui/atoms';
import { useTranslations } from 'next-intl';

import { tenantsViewVariants } from './tenants-view-variants';

export type TTenantsViewProps = {
  tenants: TTenant[];
};

/**
 * The Tenants page body: heading, the (deliberately disabled) add-tenant
 * entry point, and the real tenant list. Ships from day one — with one
 * tenant it's still a finished page, not a placeholder.
 */
export function TenantsView({ tenants }: TTenantsViewProps) {
  const t = useTranslations('tenantsView');
  const addTenantReasonText = t('addTenantReason');
  const { root, header, title, description, addTenant, addTenantReason } =
    tenantsViewVariants();

  return (
    <div className={root()}>
      <div className={header()}>
        <div>
          <h1 className={title()}>{t('title')}</h1>
          <p className={description()}>
            {t.rich('description', { code: (chunks) => <code>{chunks}</code> })}
          </p>
        </div>
        <div className={addTenant()}>
          <Button
            variant="primary"
            disabled={true}
            title={addTenantReasonText}
            aria-describedby="add-tenant-reason"
          >
            {t('addTenant')}
          </Button>
          <p id="add-tenant-reason" className={addTenantReason()}>
            {addTenantReasonText}
          </p>
        </div>
      </div>
      <TenantsTable tenants={tenants} />
    </div>
  );
}
