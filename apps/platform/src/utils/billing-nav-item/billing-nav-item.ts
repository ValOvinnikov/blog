import type { TSidebarNavItem } from '@platform/components/features/layout/sidebar';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { ICONS } from '@shinefold/config';

export const billingNavItem = (
  t: TLooseTranslator,
  href: string,
): TSidebarNavItem => ({ label: t('billing'), icon: ICONS.CHECK_SHEET, href });
