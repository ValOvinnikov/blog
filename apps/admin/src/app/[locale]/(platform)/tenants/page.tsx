import { TenantsView } from '@admin/components/tenants-view';
import { queries } from '@blog/db';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('tenants') };
}

export default async function TenantsPage() {
  const tenants = await queries.tenants.listTenants();

  return <TenantsView tenants={tenants} />;
}
