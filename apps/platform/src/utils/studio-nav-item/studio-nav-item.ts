import type { TSidebarNavItem } from '@platform/components/features/layout/sidebar';
import type { TRegisteredIconName } from '@platform/components/shared/icon';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { isPendingStudioAccess } from '@platform/utils/pending-studio-access/pending-studio-access';
import { ownerStudioAccessTone } from '@platform/utils/status-tone/status-tone';
import { ICONS } from '@shinefold/config';
import {
  STUDIO_ACCESS,
  type TStudioAccess,
  type TPendingStudioAccess,
} from '@shinefold/config/constants';

const STUDIO_ACCESS_LINE_ICON: Record<
  TPendingStudioAccess,
  TRegisteredIconName
> = {
  [STUDIO_ACCESS.INVITE_SENT]: ICONS.MAIL,
  [STUDIO_ACCESS.ACTIVATING]: ICONS.CLOCK,
  [STUDIO_ACCESS.STALLED]: ICONS.WARNING,
};

export const studioNavItem = (
  t: TLooseTranslator,
  href: string,
  access?: TStudioAccess,
): TSidebarNavItem => ({
  label: t('studio'),
  icon: ICONS.STUDIO,
  href,
  ...(isPendingStudioAccess(access) && {
    status: {
      text: t(`studioAccessLine.${access}`),
      icon: STUDIO_ACCESS_LINE_ICON[access],
      tone: ownerStudioAccessTone(access),
    },
  }),
});
