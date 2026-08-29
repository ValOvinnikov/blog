import { ALERT_TYPE } from '@blog/config';
import { queries } from '@blog/db';
import { StudioMount } from '@blog/studio';
import { Alert } from '@platform/components/shared/alert';
import { StudioShell } from '@platform/components/shared/studio-shell';
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
 * `requireTenantById` — not a `memberships` check — gates this: any
 * `admins` row may open any tenant's Studio here, regardless of whether
 * that admin also holds a `memberships` row for it. An owner with no
 * `admins` row 404s at the ancestor layout before the tenant is even
 * looked up here, so editing the `tenantId` in the URL can't reach another
 * tenant's Studio. `requireTenantById` is `cache()`-wrapped, so this reuses
 * the ancestor layout's fetch rather than resolving the tenant twice.
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
    <StudioShell>
      <StudioMount
        projectId={credentials.projectId}
        dataset={credentials.dataset}
        basePath={adminRoutes.tenantStudio(tenant.id)}
        title={tenant.name}
      />
    </StudioShell>
  );
}
