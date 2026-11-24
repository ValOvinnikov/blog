import type { TSidebarNavItem } from '@platform/components/features/layout/sidebar';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { adminRoutes } from '@platform/utils/routes/routes';
import { ICONS } from '@shinefold/config';

export const superAdminNavItems = (t: TLooseTranslator): TSidebarNavItem[] => [
  {
    label: t('releases'),
    icon: ICONS.CHECK_SHEET,
    href: adminRoutes.releases(),
  },
  {
    label: t('blockedSignups'),
    icon: ICONS.SHIELD_CHECK,
    href: adminRoutes.blockedSignups(),
  },
  {
    label: t('dataRequests'),
    icon: ICONS.LOCK,
    href: adminRoutes.dataRequests(),
  },
  { label: t('admins'), icon: ICONS.USERS, href: adminRoutes.admins() },
];
