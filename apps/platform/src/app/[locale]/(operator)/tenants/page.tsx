import { queries } from '@blog/db';
import { TenantsView } from '@platform/components/features/tenants/tenants-view';
import { env } from '@platform/utils/env/env';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pageMetadata');
  return { title: t('tenants') };
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
