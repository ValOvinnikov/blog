import { ALERT_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { StudioMount } from '@blog/studio';
import { Alert } from '@platform/components/shared/alert';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type TProps = {
  params: Promise<{ tenantId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('studio') };
}

/**
 * Gated via `requireTenantById`, not a `memberships` check — any `admins`
 * row may open any tenant's Studio regardless of that admin's own
 * `memberships` row for it, so editing the `tenantId` in the URL can't let
 * a tenant owner reach another tenant's Studio.
 */
export default async function TenantStudioPage({ params }: TProps) {
  const { tenantId } = await params;
  const { tenant } = await requireTenantById(tenantId);
  const credentials = await queries.tenants.getTenantSanityCredentials(
    tenant.id,
  );
  const t = await getTranslations('studioPage');

  if (!credentials) {
    return (
      <Alert
        type={ALERT_TYPE.WARNING}
        title={t('notProvisionedTitle')}
        description={t('notProvisionedDescription')}
      />
    );
  }

  return (
    <StudioMount
      projectId={credentials.projectId}
      dataset={credentials.dataset}
      basePath={adminRoutes.tenantStudio(tenant.id)}
      title={tenant.name}
    />
  );
}
