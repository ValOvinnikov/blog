import { queries } from '@blog/db';
import { TenantsView } from '@platform/components/features/tenants/tenants-view';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { env } from '@platform/utils/env/env';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('tenants');
}

type TProps = {
  searchParams: Promise<{ archived?: string }>;
};

export default async function TenantsPage({ searchParams }: TProps) {
  const { archived } = await searchParams;
  const showArchived = archived === '1';

  const tenants = await queries.tenants.listTenants({
    includeArchived: showArchived,
  });

  return (
    <TenantsView
      tenants={tenants}
      shouldShowArchived={showArchived}
      isEmailAlertingConfigured={!!env.RESEND_API_KEY}
    />
  );
}
