import { AddTenantWizard } from '@platform/components/features/tenants/add-tenant-wizard';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('addTenant');
}

export default function NewTenantPage() {
  return <AddTenantWizard />;
}
