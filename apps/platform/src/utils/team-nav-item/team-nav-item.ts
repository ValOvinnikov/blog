import type { TSidebarNavItem } from '@platform/components/features/layout/sidebar';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { ICONS } from '@shinefold/config';

export const teamNavItem = (
  t: TLooseTranslator,
  href: string,
): TSidebarNavItem => ({ label: t('team'), icon: ICONS.USERS, href });
