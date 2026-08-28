import { queries } from '@blog/db';
import { DeprovisionTenantControl } from '@platform/components/features/tenants/deprovision-tenant-control';
import { PageHeader } from '@platform/components/shared/page-header';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('tenantDanger') };
}

type TProps = {
  params: Promise<{ tenantId: string }>;
};

/**
 * Gated by `requireSuperAdmin`, tighter than the layout's own
 * `requireTenantById` — deprovisioning is destructive, so any `admins` row
 * is not enough here even though it is for the rest of this tenant's pages.
 */
export default async function TenantDangerPage({ params }: TProps) {
  await requireSuperAdmin();
  const { tenantId } = await params;

  const [tenant] = await queries.tenants.listTenantsByIds([tenantId]);

  if (!tenant) {
    notFound();
  }

  const t = await getTranslations('tenantDangerPage');

  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <DeprovisionTenantControl tenant={tenant} />
    </>
  );
}
