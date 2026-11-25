import { TenantsView } from '@platform/components/features/tenants/tenants-view';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { toClientTenant } from '@platform/server/tenants/to-client-tenant';
import { toPlatformTenantSummary } from '@platform/utils/platform-tenant/platform-tenant';
import {
  parseTenantsListQuery,
  type TTenantsListSearchParams,
} from '@platform/utils/tenants-list-query/tenants-list-query';
import { EMAIL_ACCOUNT } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
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
  const { shouldShowArchived, sort, search } = listQuery;

  const tenants = await queries.tenants.listTenants({
    includeArchived: shouldShowArchived,
    sort,
    search,
  });

  return (
    <TenantsView
      tenants={tenants.map((tenant) => ({
        ...toClientTenant(toPlatformTenantSummary(tenant)),
        matchedDomain: tenant.matchedDomain,
      }))}
      listQuery={listQuery}
      isEmailAlertingConfigured={isEmailAccountConfigured(
        EMAIL_ACCOUNT.PLATFORM,
      )}
    />
  );
}
