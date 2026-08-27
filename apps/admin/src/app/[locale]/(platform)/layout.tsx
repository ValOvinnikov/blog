import { AdminShell } from '@admin/components/features/layout/admin-shell';
import { PlatformBreadcrumb } from '@admin/components/features/layout/platform-breadcrumb';
import { auth } from '@admin/server/auth/auth';
import { requireAdmin } from '@admin/server/auth/require-admin';
import {
  platformNavSections,
  type TNavTranslator,
} from '@admin/utils/nav-sections/nav-sections';
import { queries } from '@blog/db';
import { getTranslations } from 'next-intl/server';

type TProps = {
  children: React.ReactNode;
  /** Present only for the `/tenants/{id}` overview and `/tenants/{id}/provisioning` routes this layout also wraps. */
  params: Promise<{ tenantId?: string }>;
};

/**
 * Gates page rendering for everything nested under this segment behind an
 * `admins` row (`requireAdmin`) — the Platform section, as opposed to a
 * tenant's own `memberships`-gated section. Route Handlers and Server Actions
 * placed under this segment are not covered by a layout and must call
 * `requireAdmin()` themselves.
 */
export default async function PlatformLayout({ children, params }: TProps) {
  const { tenantId } = await params;
  const admin = await requireAdmin();
  const session = await auth();
  const tNavSections = (await getTranslations(
    'navSections',
  )) as unknown as TNavTranslator;

  const tenant = tenantId
    ? await queries.tenants.getTenantById(tenantId)
    : undefined;

  return (
    <AdminShell
      sections={platformNavSections(tNavSections)}
      crumb={
        <PlatformBreadcrumb tenantId={tenant?.id} tenantName={tenant?.name} />
      }
      roleChip={{
        name: session?.user?.name ?? session?.user?.email ?? admin.role,
        role: admin.role,
        scope: tNavSections('platformLabel'),
      }}
    >
      {children}
    </AdminShell>
  );
}
