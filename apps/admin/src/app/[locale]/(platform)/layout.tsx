import { AdminShell } from '@admin/components/features/layout/admin-shell';
import { PlatformBreadcrumb } from '@admin/components/features/layout/platform-breadcrumb';
import { auth } from '@admin/server/auth/auth';
import { requireAdmin } from '@admin/server/auth/require-admin';
import {
  platformNavSections,
  type TNavTranslator,
} from '@admin/utils/nav-sections/nav-sections';
import { getTranslations } from 'next-intl/server';

type TProps = {
  children: React.ReactNode;
};

/**
 * Gates page rendering for everything nested under this segment behind an
 * `admins` row (`requireAdmin`) — the Platform section, as opposed to a
 * tenant's own `memberships`-gated section. Route Handlers and Server Actions
 * placed under this segment are not covered by a layout and must call
 * `requireAdmin()` themselves.
 *
 * Its own directory path (`(platform)/layout.tsx`) has no dynamic segment —
 * `tenantId` belongs to routes several directories deeper — so it can't type
 * a `tenantId` param itself; `PlatformBreadcrumb` resolves that at runtime
 * instead via `useParams`.
 */
export default async function PlatformLayout({ children }: TProps) {
  const admin = await requireAdmin();
  const session = await auth();
  const tNavSections = (await getTranslations(
    'navSections',
  )) as unknown as TNavTranslator;

  return (
    <AdminShell
      sections={platformNavSections(tNavSections)}
      crumb={<PlatformBreadcrumb />}
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
