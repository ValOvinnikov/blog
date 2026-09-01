import { ALERT_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { StudioMount } from '@blog/studio';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { PageHeader } from '@platform/components/shared/page-header';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('studio') };
}

/**
 * Studio owns everything under this catch-all with its own client-side
 * router — `params.tool` is never read here. `resolveDashboardTenant` is
 * `cache()`-wrapped, so this reuses the enclosing `(tenant)/layout.tsx`'s
 * fetch rather than resolving the tenant twice.
 */
export default async function DashboardStudioPage() {
  const { tenant } = await resolveDashboardTenant();
  const t = await getTranslations('studioPage');

  if (tenant.deprovisionedAt) {
    return (
      <>
        <PageHeader title={t('title')} />
        <ArchivedTenantNotice archivedAt={tenant.deprovisionedAt} />
      </>
    );
  }

  const credentials = await queries.tenants.getTenantSanityCredentials(
    tenant.id,
  );

  if (!credentials) {
    return (
      <>
        <PageHeader title={t('title')} />
        <Alert
          type={ALERT_TYPE.WARNING}
          title={t('notProvisionedTitle')}
          description={t('notProvisionedDescription')}
        />
      </>
    );
  }

  return (
    <StudioMount
      projectId={credentials.projectId}
      dataset={credentials.dataset}
      basePath={adminRoutes.dashboardStudio()}
      title={tenant.name}
    />
  );
}
