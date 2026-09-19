import { StudioMountView } from '@platform/components/features/studio/studio-mount-view';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('studio') };
}

/**
 * `resolveDashboardTenant` is `cache()`-wrapped, so this reuses the
 * enclosing `(tenant)/layout.tsx`'s fetch rather than resolving the tenant
 * twice. `params.tool` is never read — Studio owns everything under this
 * catch-all with its own client-side router.
 */
export default async function DashboardStudioPage() {
  const { tenant } = await resolveDashboardTenant();

  return StudioMountView({ tenant, basePath: adminRoutes.dashboardStudio() });
}
