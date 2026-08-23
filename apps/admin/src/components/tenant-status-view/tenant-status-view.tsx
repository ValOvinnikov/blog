import { DeprovisionTenantControl } from '@admin/components/deprovision-tenant-control';
import { ProvisioningStatusView } from '@admin/components/provisioning-status-view';
import type { TDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import type { TTenant } from '@blog/db/schema/tenants';

import { tenantStatusViewVariants } from './tenant-status-view-variants';

export type TTenantStatusViewProps = {
  tenant: TTenant;
  domainVerificationStatus: TDomainVerificationStatus;
  ownerEmail: string | undefined;
};

/**
 * The tenant status page's full body: live provisioning progress, then the
 * deprovisioning danger zone below it. Kept separate from
 * `ProvisioningStatusView` itself since the two are independently testable
 * and the latter predates deprovisioning entirely.
 */
export const TenantStatusView = ({
  tenant,
  domainVerificationStatus,
  ownerEmail,
}: TTenantStatusViewProps) => {
  const { root } = tenantStatusViewVariants();

  return (
    <div className={root()}>
      <ProvisioningStatusView
        tenant={tenant}
        domainVerificationStatus={domainVerificationStatus}
        ownerEmail={ownerEmail}
      />
      <DeprovisionTenantControl tenant={tenant} />
    </div>
  );
};
