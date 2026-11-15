import { UpgradePageContent } from '@platform/components/features/upgrade/upgrade-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { readSignupPromo } from '@platform/server/billing/read-signup-promo';
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
  const { promo, isReturning } = parseUpgradeSearchParams(await searchParams);
  const upgradeQuery = {
    promo: promo ?? (await readSignupPromo()),
    isReturning,
  };

  return renderTenantScopedPage(resolveDashboardTenant, (context) =>
    UpgradePageContent({ ...context, ...upgradeQuery }),
  );
}
