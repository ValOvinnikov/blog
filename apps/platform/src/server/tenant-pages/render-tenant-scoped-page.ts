import 'server-only';

import type { TTenant } from '@blog/db/schema/tenants';
import {
  planPageAccess,
  type TPlanPage,
} from '@platform/utils/plan-page-access/plan-page-access';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

// Called as a function, never as JSX: an async component nested via JSX resolves only under a real RSC renderer.
export const renderTenantScopedPage = async <T extends { tenant: TTenant }>(
  resolveTenant: () => Promise<T>,
  PageContent: (context: T) => Promise<ReactNode>,
  planGatedPage?: TPlanPage,
): Promise<ReactNode> => {
  const context = await resolveTenant();
  if (planGatedPage && !planPageAccess(context.tenant.plan)[planGatedPage]) {
    notFound();
  }
  return PageContent(context);
};
