import { AdminShell } from '@admin/components/admin-shell';
import { TenantSwitcher } from '@admin/components/tenant-switcher';
import { requireTenantMembership } from '@admin/server/auth/require-tenant-membership';

type TProps = {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
};

/**
 * Gates page rendering for everything nested under this segment behind a
 * `memberships` row for the routed tenant (`requireTenantMembership`) — the
 * Tenant section, independent of the Platform `admins` gate. Look and Voice
 * (and every other tenant tab) land as additions to `sections` below, not a
 * reshape of this layout.
 */
export default async function TenantLayout({ children, params }: TProps) {
  const { tenantSlug } = await params;
  const { tenant, membership } = await requireTenantMembership(tenantSlug);

  return (
    <AdminShell
      sections={[
        {
          label: `Tenant · ${tenant.slug}`,
          items: [],
          note: 'Look and Voice ship soon.',
        },
      ]}
      switcher={
        <TenantSwitcher tenants={[tenant]} activeTenantId={tenant.id} />
      }
      crumb="Tenant"
      roleLabel={`${membership.role} · Tenant`}
    >
      {children}
    </AdminShell>
  );
}
