import { TenantDetailsForm } from '@admin/components/features/tenants/tenant-details-form';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('addTenant') };
}

export default function AddTenantPage() {
  return <TenantDetailsForm />;
}
