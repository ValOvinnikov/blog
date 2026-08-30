'use client';

import { ICONS } from '@blog/config';
import { useSidebarCollapse } from '@platform/components/features/layout/sidebar-collapse-provider';
import { Icon } from '@platform/components/shared/icon';
import { useTranslations } from 'next-intl';

import { sidebarCollapseToggleVariants } from './sidebar-collapse-toggle-variants';

export type TSidebarCollapseToggleProps = {
  className?: string;
};

/**
 * The sidebar's own collapse control, at the top-right of its brand row.
 * Reads and flips `SidebarCollapseProvider`'s state directly rather than
 * taking it as props, since `Sidebar` (its parent's render tree) stays a
 * Server Component.
 */
export const SidebarCollapseToggle = ({
  className,
}: TSidebarCollapseToggleProps) => {
  const { isCollapsed, toggle } = useSidebarCollapse();
  const t = useTranslations('sidebar');
  const label = isCollapsed ? t('expandToggle') : t('collapseToggle');
  const { root, icon } = sidebarCollapseToggleVariants({ isCollapsed });

  return (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={!isCollapsed}
      aria-label={label}
      title={label}
      className={root({ class: className })}
    >
      <Icon name={ICONS.CHEVRON_RIGHT} className={icon()} />
    </button>
  );
};
