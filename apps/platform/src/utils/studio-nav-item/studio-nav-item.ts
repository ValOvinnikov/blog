import { ICONS } from '@blog/config';
import type { TNavItemBadge } from '@platform/components/features/layout/nav-item-content';
import type { TSidebarNavItem } from '@platform/components/features/layout/sidebar';
import {
  OWNER_STUDIO_ACCESS,
  type TOwnerStudioAccess,
} from '@platform/constants/owner-studio-access';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';

const STUDIO_ACCESS_TONE = {
  [OWNER_STUDIO_ACCESS.INVITE_SENT]: 'warn',
  [OWNER_STUDIO_ACCESS.ACTIVATING]: 'brand',
  [OWNER_STUDIO_ACCESS.READY]: 'ok',
  [OWNER_STUDIO_ACCESS.STALLED]: 'bad',
} as const satisfies Record<TOwnerStudioAccess, TNavItemBadge['tone']>;

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
      tone: STUDIO_ACCESS_TONE[studioAccess],
    },
  }),
});
