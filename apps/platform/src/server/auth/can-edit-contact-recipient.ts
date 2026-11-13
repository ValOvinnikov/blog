import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export const canEditContactRecipient = (
  { pageAccess }: TPlatformTenant,
  { canManage }: TPlatformViewer,
): boolean => pageAccess.leads && canManage;
