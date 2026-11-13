import { UpgradePageContent } from '@platform/components/features/upgrade/upgrade-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import {
  parseUpgradeSearchParams,
  type TUpgradeSearchParams,
} from '@platform/utils/upgrade-search-params/upgrade-search-params';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('upgrade');
}

type TProps = {
  searchParams: Promise<TUpgradeSearchParams>;
};

export default async function DashboardUpgradePage({ searchParams }: TProps) {
  const upgradeQuery = parseUpgradeSearchParams(await searchParams);

  return renderTenantScopedPage(resolveDashboardTenant, (context) =>
    UpgradePageContent({ ...context, ...upgradeQuery }),
  );
}
