import { queries } from '@blog/db';
import { PlatformShell } from '@platform/components/features/layout/platform-shell';
import { TenantBreadcrumb } from '@platform/components/features/layout/tenant-breadcrumb';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import { loadPlatformShellChrome } from '@platform/server/layout/load-platform-shell-chrome';
import {
  operatorNavSections,
  tenantNavSections,
} from '@platform/utils/nav-sections/nav-sections';
import { getTranslations } from 'next-intl/server';

type TProps = {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
};

export default async function TenantDetailLayout({ children, params }: TProps) {
  const { tenantId } = await params;
  // Deduped against the ancestor layout's gate by `requireTenantById`'s own `cache()`.
  const { tenant, admin } = await requireTenantById(tenantId);
  const [
    { isSidebarInitiallyCollapsed, tNavSections, userName, userEmail },
    t,
    unreadLeadsCount,
  ] = await Promise.all([
    loadPlatformShellChrome(),
    getTranslations('tenantLayout'),
    queries.leads.countUnreadLeadsForTenant(tenant.id),
  ]);

  return (
    <PlatformShell
      isSidebarInitiallyCollapsed={isSidebarInitiallyCollapsed}
      sections={[
        ...operatorNavSections(tNavSections, admin.role),
        ...tenantNavSections(
          tNavSections,
          tenant.id,
          tenant.name,
          unreadLeadsCount,
        ),
      ]}
      crumb={<TenantBreadcrumb tenantId={tenant.id} tenantName={tenant.name} />}
      account={{
        name: userName,
        email: userEmail,
        role: admin.role,
        scope: t('scopeLabel'),
      }}
    >
      {children}
    </PlatformShell>
  );
}
