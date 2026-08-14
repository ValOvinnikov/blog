import { AdminShell } from '@admin/components/admin-shell';
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
 */
export default async function PlatformLayout({ children }: TProps) {
  const admin = await requireAdmin();
  const t = await getTranslations('platformLayout');
  const tNavSections = (await getTranslations(
    'navSections',
  )) as unknown as TNavTranslator;

  return (
    <AdminShell
      sections={platformNavSections(tNavSections)}
      crumb={t('crumb')}
      roleLabel={t('roleLabel', { role: admin.role })}
    >
      {children}
    </AdminShell>
  );
}
