import { TenantsTable } from '@admin/components/tenants-table';
import type { TTenant } from '@blog/db/schema/tenants';
import { Button } from '@blog/ui/atoms';

import { tenantsViewVariants } from './tenants-view-variants';

export type TTenantsViewProps = {
  tenants: TTenant[];
};

const ADD_TENANT_REASON =
  'Provisioning is deferred until the tenant-resolution layer ships.';

/**
 * The Tenants page body: heading, the (deliberately disabled) add-tenant
 * entry point, and the real tenant list. Ships from day one — with one
 * tenant it's still a finished page, not a placeholder.
 */
export function TenantsView({ tenants }: TTenantsViewProps) {
  const { root, header, title, description, addTenant, addTenantReason } =
    tenantsViewVariants();

  return (
    <div className={root()}>
      <div className={header()}>
        <div>
          <h1 className={title()}>Tenants</h1>
          <p className={description()}>
            Every site on the platform, read from the real <code>tenants</code>{' '}
            table.
          </p>
        </div>
        <div className={addTenant()}>
          <Button
            variant="primary"
            disabled={true}
            title={ADD_TENANT_REASON}
            aria-describedby="add-tenant-reason"
          >
            + Add tenant
          </Button>
          <p id="add-tenant-reason" className={addTenantReason()}>
            {ADD_TENANT_REASON}
          </p>
        </div>
      </div>
      <TenantsTable tenants={tenants} />
    </div>
  );
}
