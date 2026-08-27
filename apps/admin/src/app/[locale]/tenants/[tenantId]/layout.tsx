import { AdminShell } from '@admin/components/features/layout/admin-shell';
import { TenantSwitcher } from '@admin/components/features/layout/tenant-switcher';
import { requireTenantById } from '@admin/server/auth/require-tenant-by-id';
import {
  platformNavSections,
  tenantNavSections,
  type TNavTranslator,
} from '@admin/utils/nav-sections/nav-sections';
import { getTranslations } from 'next-intl/server';

type TProps = {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
};

/**
 * Gates page rendering for everything nested under this segment behind an
 * `admins` row (`requireTenantById`) — the platform-operator counterpart to
 * the tenant's own `memberships`-gated `requireTenantMembership`, keyed by
 * tenant id rather than slug.
 */
export default async function TenantByIdLayout({ children, params }: TProps) {
  const { tenantId } = await params;
  const { tenant, admin } = await requireTenantById(tenantId);
  const t = await getTranslations('tenantLayout');
  const tNavSections = (await getTranslations(
    'navSections',
  )) as unknown as TNavTranslator;

  return (
    <AdminShell
      sections={[
        ...platformNavSections(tNavSections),
        ...tenantNavSections(tNavSections, tenant.id, tenant.name),
      ]}
      switcher={
        <TenantSwitcher tenants={[tenant]} activeTenantId={tenant.id} />
      }
      crumb={t('crumb')}
      roleLabel={t('roleLabel', { role: admin.role })}
    >
      {children}
    </AdminShell>
  );
}
