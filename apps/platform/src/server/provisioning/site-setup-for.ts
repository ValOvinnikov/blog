import 'server-only';

import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import { toClientTenant } from '@platform/server/tenants/to-client-tenant';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import type { TMaybeUndefined } from '@shinefold/config';
import { TENANT_PROVISIONING_STATUS } from '@shinefold/db/constants';

export type TSiteSetup = {
  tenant: ReturnType<typeof toClientTenant>;
  canRetry: boolean;
};

/** The overview's setup progress, for the viewers `getTenantProvisioningStatusAction` admits, until provisioning is READY. */
export const siteSetupFor = (
  tenant: TPlatformTenant,
  { canManage, isOperator, isSuperAdmin }: TPlatformViewer,
): TMaybeUndefined<TSiteSetup> => {
  const { provisioningStatus } = tenant;

  if (
    !provisioningStatus ||
    provisioningStatus === TENANT_PROVISIONING_STATUS.READY ||
    !canManage
  ) {
    return undefined;
  }

  return {
    tenant: toClientTenant(tenant),
    canRetry: isSuperAdmin || !isOperator,
  };
};
