import { TenantsView } from '@platform/components/features/tenants/tenants-view';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { loadTenantsPage } from '@platform/server/tenants/load-tenants-page';
import {
  parseTenantsListQuery,
  type TTenantsListSearchParams,
} from '@platform/utils/tenants-list-query/tenants-list-query';
import { EMAIL_ACCOUNT } from '@shinefold/config/constants';
import { isEmailAccountConfigured } from '@shinefold/email';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('tenants');
}

type TProps = {
  searchParams: Promise<TTenantsListSearchParams>;
};

export default async function TenantsPage({ searchParams }: TProps) {
  await requireAdmin();

  const listQuery = parseTenantsListQuery(await searchParams);
  const { rows, total, totalPages } = await loadTenantsPage(listQuery);

  return (
    <TenantsView
      tenants={rows}
      total={total}
      totalPages={totalPages}
      listQuery={listQuery}
      isEmailAlertingConfigured={isEmailAccountConfigured(
        EMAIL_ACCOUNT.PLATFORM,
      )}
    />
  );
}
