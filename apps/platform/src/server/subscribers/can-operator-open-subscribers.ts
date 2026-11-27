import 'server-only';

import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export const canOperatorOpenSubscribers = (
  {
    pageAccess,
    createdFromPlatform,
  }: Pick<TPlatformTenant, 'pageAccess' | 'createdFromPlatform'>,
  { isSuperAdmin }: Pick<TPlatformViewer, 'isSuperAdmin'>,
): boolean => isSuperAdmin && createdFromPlatform && pageAccess.subscribers;
