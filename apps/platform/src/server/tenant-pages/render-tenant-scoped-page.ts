import 'server-only';

import type { TPlanPage } from '@platform/utils/plan-page-access/plan-page-access';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

// Called as a function, never as JSX: an async component nested via JSX resolves only under a real RSC renderer.
export const renderTenantScopedPage = async <
  T extends { tenant: TPlatformTenant },
>(
  resolveTenant: () => Promise<T>,
  PageContent: (context: T) => Promise<ReactNode>,
  planGatedPage?: TPlanPage,
): Promise<ReactNode> => {
  const context = await resolveTenant();
  if (planGatedPage && !context.tenant.pageAccess[planGatedPage]) {
    notFound();
  }
  return PageContent(context);
};
