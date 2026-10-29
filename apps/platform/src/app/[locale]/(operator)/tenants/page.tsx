import { queries } from '@blog/db';
import { TenantsView } from '@platform/components/features/tenants/tenants-view';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { toClientTenant } from '@platform/server/tenants/to-client-tenant';
import { env } from '@platform/utils/env/env';
import {
  parseTenantsListQuery,
  type TTenantsListSearchParams,
} from '@platform/utils/tenants-list-query/tenants-list-query';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('tenants');
}

type TProps = {
  searchParams: Promise<TTenantsListSearchParams>;
};

export default async function TenantsPage({ searchParams }: TProps) {
  const listQuery = parseTenantsListQuery(await searchParams);
  const { shouldShowArchived, sort, search } = listQuery;

  const tenants = await queries.tenants.listTenants({
    includeArchived: shouldShowArchived,
    sort,
    search,
  });

  return (
    <TenantsView
      tenants={tenants.map(toClientTenant)}
      listQuery={listQuery}
      isEmailAlertingConfigured={!!env.RESEND_API_KEY}
    />
  );
}
