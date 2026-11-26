import { adminRoutes } from '@platform/utils/routes/routes';
import { TENANT_PROVISIONING_STATUS } from '@shinefold/db/constants';
import type { TTenantsPageRow } from '@shinefold/db/queries/tenants/tenants-page-row';

export const tenantManageHref = ({
  id,
  provisioningStatus,
}: Pick<TTenantsPageRow, 'id' | 'provisioningStatus'>): string =>
  provisioningStatus === TENANT_PROVISIONING_STATUS.READY
    ? adminRoutes.tenantOverview(id)
    : adminRoutes.tenantProvisioning(id);
