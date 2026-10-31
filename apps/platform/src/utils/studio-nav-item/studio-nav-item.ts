import { ICONS } from '@blog/config';
import type { TSidebarNavItem } from '@platform/components/features/layout/sidebar';
import {
  OWNER_STUDIO_ACCESS,
  type TOwnerStudioAccess,
} from '@platform/constants/owner-studio-access';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { ownerStudioAccessTone } from '@platform/utils/status-tone/status-tone';

export type TStudioNavState = {
  access: TOwnerStudioAccess;
  hasEntered: boolean;
};

const isBadged = (studio?: TStudioNavState): studio is TStudioNavState =>
  !!studio &&
  !(studio.access === OWNER_STUDIO_ACCESS.READY && studio.hasEntered);

export const studioNavItem = (
  t: TLooseTranslator,
  href: string,
  studio?: TStudioNavState,
): TSidebarNavItem => ({
  label: t('studio'),
  icon: ICONS.STUDIO,
  href,
  ...(isBadged(studio) && {
    badge: {
      label: t(`studioAccess.${studio.access}`),
      tone: ownerStudioAccessTone(studio.access),
    },
  }),
});
