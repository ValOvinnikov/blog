import 'server-only';

import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export const canOperatorOpenSubscribers = (
  {
    pageAccess,
    createdFromPlatform,
    isArchived,
  }: Pick<TPlatformTenant, 'pageAccess' | 'createdFromPlatform' | 'isArchived'>,
  { isSuperAdmin }: Pick<TPlatformViewer, 'isSuperAdmin'>,
): boolean =>
  isSuperAdmin && createdFromPlatform && !isArchived && pageAccess.subscribers;
