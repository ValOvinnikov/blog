import { TenantsView } from '@platform/components/features/tenants/tenants-view';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { loadPinnedTenants } from '@platform/server/tenants/load-pinned-tenants';
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
  const admin = await requireAdmin();

  const listQuery = parseTenantsListQuery(await searchParams);
  const [{ rows, total, totalPages }, pinnedTenants] = await Promise.all([
    loadTenantsPage(listQuery),
    loadPinnedTenants(admin.id),
  ]);

  return (
    <TenantsView
      tenants={rows}
      pinnedTenants={pinnedTenants}
      total={total}
      totalPages={totalPages}
      listQuery={listQuery}
      isEmailAlertingConfigured={isEmailAccountConfigured(
        EMAIL_ACCOUNT.PLATFORM,
      )}
    />
  );
}
