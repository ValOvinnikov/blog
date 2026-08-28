import { AdminShell } from '@admin/components/features/layout/admin-shell';
import { OperatorBreadcrumb } from '@admin/components/features/layout/operator-breadcrumb';
import { auth } from '@admin/server/auth/auth';
import { requireAdmin } from '@admin/server/auth/require-admin';
import {
  operatorNavSections,
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
 * Its own directory path (`(operator)/layout.tsx`) has no dynamic segment —
 * `tenantId` belongs to routes several directories deeper — so it can't type
 * a `tenantId` param itself; `OperatorBreadcrumb` resolves that at runtime
 * instead via `useParams`.
 */
export default async function OperatorLayout({ children }: TProps) {
  const admin = await requireAdmin();
  const session = await auth();
  const tNavSections = (await getTranslations(
    'navSections',
  )) as unknown as TNavTranslator;

  return (
    <AdminShell
      sections={operatorNavSections(tNavSections)}
      crumb={<OperatorBreadcrumb />}
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
