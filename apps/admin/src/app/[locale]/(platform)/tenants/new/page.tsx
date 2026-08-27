import { AddTenantWizard } from '@admin/components/features/tenants/add-tenant-wizard';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('addTenant') };
}

export default function NewTenantPage() {
  return <AddTenantWizard />;
}
