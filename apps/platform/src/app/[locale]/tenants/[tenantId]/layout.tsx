import { AdminShell } from '@platform/components/features/layout/admin-shell';
import { TenantBreadcrumb } from '@platform/components/features/layout/tenant-breadcrumb';
import { TenantSwitcher } from '@platform/components/features/layout/tenant-switcher';
import { auth } from '@platform/server/auth/auth';
import { requireTenantById } from '@platform/server/auth/require-tenant-by-id';
import {
  operatorNavSections,
  tenantNavSections,
  type TNavTranslator,
} from '@platform/utils/nav-sections/nav-sections';
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
  const session = await auth();
  const t = await getTranslations('tenantLayout');
  const tNavSections = (await getTranslations(
    'navSections',
  )) as unknown as TNavTranslator;

  return (
    <AdminShell
      sections={[
        ...operatorNavSections(tNavSections),
        ...tenantNavSections(tNavSections, tenant.id, tenant.name),
      ]}
      switcher={
        <TenantSwitcher tenants={[tenant]} activeTenantId={tenant.id} />
      }
      crumb={<TenantBreadcrumb tenantId={tenant.id} tenantName={tenant.name} />}
      roleChip={{
        name: session?.user?.name ?? session?.user?.email ?? admin.role,
        role: admin.role,
        scope: t('scopeLabel'),
      }}
    >
      {children}
    </AdminShell>
  );
}
