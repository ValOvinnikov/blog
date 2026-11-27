import type { TSidebarNavItem } from '@platform/components/features/layout/sidebar';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { adminRoutes } from '@platform/utils/routes/routes';
import { ICONS } from '@shinefold/config';

export const tenantPlatformNavItems = (
  t: TLooseTranslator,
  tenantId: string,
): TSidebarNavItem[] => {
  const badge = {
    label: t('badgePlatform'),
    tone: BADGE_TONE.NEUTRAL,
    hasDot: false,
  } as const;

  return [
    {
      label: t('provisioning'),
      icon: ICONS.CHECK_SHEET,
      href: adminRoutes.tenantProvisioning(tenantId),
      badge,
    },
    {
      label: t('dangerZone'),
      icon: ICONS.WARNING,
      href: adminRoutes.tenantDanger(tenantId),
      badge,
    },
  ];
};
