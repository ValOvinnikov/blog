import { AddTenantWizard } from '@platform/components/features/tenants/add-tenant-wizard';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { env } from '@platform/utils/env/env';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('addTenant');
}

export default async function NewTenantPage() {
  await requireAdmin();

  return <AddTenantWizard rootDomain={env.TENANT_ROOT_DOMAIN} />;
}
