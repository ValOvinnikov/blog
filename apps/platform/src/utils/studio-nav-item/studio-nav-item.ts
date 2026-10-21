import { ICONS } from '@blog/config';
import type { TSidebarNavItem } from '@platform/components/features/layout/sidebar';
import type { TOwnerStudioAccess } from '@platform/constants/owner-studio-access';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { ownerStudioAccessTone } from '@platform/utils/status-tone/status-tone';

export const studioNavItem = (
  t: TLooseTranslator,
  href: string,
  studioAccess?: TOwnerStudioAccess,
): TSidebarNavItem => ({
  label: t('studio'),
  icon: ICONS.STUDIO,
  href,
  ...(studioAccess && {
    badge: {
      label: t(`studioAccess.${studioAccess}`),
      tone: ownerStudioAccessTone(studioAccess),
    },
  }),
});
