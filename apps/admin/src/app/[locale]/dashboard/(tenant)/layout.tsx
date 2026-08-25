import { AdminShell } from '@admin/components/features/layout/admin-shell';
import { TenantSwitcher } from '@admin/components/features/layout/tenant-switcher';
import { resolveDashboardTenant } from '@admin/server/auth/resolve-dashboard-tenant';
import {
  dashboardNavSections,
  type TNavTranslator,
} from '@admin/utils/nav-sections/nav-sections';
import { adminRoutes } from '@admin/utils/routes/routes';
import { getTranslations } from 'next-intl/server';

type TProps = {
  children: React.ReactNode;
};

/**
 * Gates page rendering for everything nested under this segment behind the
 * signed-in user's own `memberships` rows (`resolveDashboardTenant`) —
 * `/dashboard`'s slug-free counterpart to `/t/[tenantSlug]/layout.tsx`'s
 * `requireTenantMembership`. Deliberately omits the Platform nav section
 * shown alongside Tenant on `/t/{slug}`: this tree exists specifically so a
 * tenant owner never sees that the platform is multi-tenant, and an
 * `admins` row grants no access here regardless.
 */
export default async function DashboardTenantLayout({ children }: TProps) {
  const { tenant, membership, tenants } = await resolveDashboardTenant();
  const t = await getTranslations('dashboardLayout');
  const tNavSections = (await getTranslations(
    'navSections',
  )) as unknown as TNavTranslator;

  return (
    <AdminShell
      sections={dashboardNavSections(tNavSections)}
      switcher={
        tenants.length > 1 ? (
          <TenantSwitcher
            tenants={tenants}
            activeTenantId={tenant.id}
            hrefFor={(candidate) =>
              adminRoutes.dashboardSelectTenantHref(candidate.id)
            }
          />
        ) : undefined
      }
      crumb={t('crumb')}
      roleLabel={t('roleLabel', { role: membership.role })}
    >
      {children}
    </AdminShell>
  );
}
