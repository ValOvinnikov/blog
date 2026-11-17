import type { TSidebarNavSection } from '@platform/components/features/layout/sidebar';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { ICONS } from '@shinefold/config';

export const helpNavSection = (
  t: TLooseTranslator,
  href: string,
): TSidebarNavSection => ({
  label: t('supportSectionLabel'),
  items: [{ label: t('help'), icon: ICONS.COMMENT, href }],
});
