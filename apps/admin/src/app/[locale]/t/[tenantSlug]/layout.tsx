import { AdminShell } from '@admin/components/features/layout/admin-shell';
import { TenantSwitcher } from '@admin/components/features/layout/tenant-switcher';
import { requireTenantMembership } from '@admin/server/auth/require-tenant-membership';
import {
  platformNavSections,
  tenantNavSections,
  type TNavTranslator,
} from '@admin/utils/nav-sections/nav-sections';
import { getTranslations } from 'next-intl/server';

type TProps = {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
};

/**
 * Gates page rendering for everything nested under this segment behind a
 * `memberships` row for the routed tenant (`requireTenantMembership`) — the
 * Tenant section, independent of the Platform `admins` gate, except that a
 * platform SUPERADMIN gets OWNER-level access to any tenant regardless.
 */
export default async function TenantLayout({ children, params }: TProps) {
  const { tenantSlug } = await params;
  const { tenant, membership } = await requireTenantMembership(tenantSlug);
  const t = await getTranslations('tenantLayout');
  const tNavSections = (await getTranslations(
    'navSections',
  )) as unknown as TNavTranslator;

  return (
    <AdminShell
      sections={[
        ...platformNavSections(tNavSections),
        ...tenantNavSections(tNavSections, tenant.slug),
      ]}
      switcher={
        <TenantSwitcher tenants={[tenant]} activeTenantId={tenant.id} />
      }
      crumb={t('crumb')}
      roleLabel={t('roleLabel', { role: membership.role })}
    >
      {children}
    </AdminShell>
  );
}
