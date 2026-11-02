import { ICONS } from '@blog/config';
import type { TSidebarNavItem } from '@platform/components/features/layout/sidebar';
import type { TRegisteredIconName } from '@platform/components/shared/icon';
import {
  OWNER_STUDIO_ACCESS,
  type TOwnerStudioAccess,
  type TPendingOwnerStudioAccess,
} from '@platform/constants/owner-studio-access';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { ownerStudioAccessTone } from '@platform/utils/status-tone/status-tone';

const STUDIO_ACCESS_LINE_ICON: Record<
  TPendingOwnerStudioAccess,
  TRegisteredIconName
> = {
  [OWNER_STUDIO_ACCESS.INVITE_SENT]: ICONS.MAIL,
  [OWNER_STUDIO_ACCESS.ACTIVATING]: ICONS.CLOCK,
  [OWNER_STUDIO_ACCESS.STALLED]: ICONS.WARNING,
};

const isPending = (
  access?: TOwnerStudioAccess,
): access is TPendingOwnerStudioAccess =>
  !!access && access !== OWNER_STUDIO_ACCESS.READY;

export const studioNavItem = (
  t: TLooseTranslator,
  href: string,
  access?: TOwnerStudioAccess,
): TSidebarNavItem => ({
  label: t('studio'),
  icon: ICONS.STUDIO,
  href,
  ...(isPending(access) && {
    status: {
      text: t(`studioAccessLine.${access}`),
      icon: STUDIO_ACCESS_LINE_ICON[access],
      tone: ownerStudioAccessTone(access),
    },
  }),
});
