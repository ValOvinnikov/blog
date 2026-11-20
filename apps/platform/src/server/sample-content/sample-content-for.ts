import 'server-only';

import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { SITE_TYPE, type TMaybeUndefined } from '@shinefold/config';
import { TENANT_PROVISIONING_STATUS } from '@shinefold/db/constants';
import { isTenantWritable } from '@shinefold/db/utils/is-tenant-writable/is-tenant-writable';

export type TSampleContent = {
  tenantId: string;
  isWritable: boolean;
};

/** A blank site is seeded without samples, so only the other site types offer their removal. */
export const sampleContentFor = (
  tenant: TPlatformTenant,
  { canManage }: TPlatformViewer,
): TMaybeUndefined<TSampleContent> => {
  const { id, siteType, provisioningStatus } = tenant;

  if (
    !canManage ||
    provisioningStatus !== TENANT_PROVISIONING_STATUS.READY ||
    !siteType ||
    siteType === SITE_TYPE.BLANK
  ) {
    return undefined;
  }

  return { tenantId: id, isWritable: isTenantWritable(tenant) };
};
