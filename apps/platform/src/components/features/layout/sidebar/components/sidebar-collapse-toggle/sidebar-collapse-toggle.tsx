'use client';

import { ICONS } from '@blog/config';
import { useSidebarCollapse } from '@platform/components/features/layout/sidebar-collapse-provider';
import { Button } from '@platform/components/shared/button';
import { Icon } from '@platform/components/shared/icon';
import { useTranslations } from 'next-intl';

import { sidebarCollapseToggleVariants } from './sidebar-collapse-toggle-variants';

export type TSidebarCollapseToggleProps = {
  className?: string;
};

export const SidebarCollapseToggle = ({
  className,
}: TSidebarCollapseToggleProps) => {
  const { isCollapsed, toggle } = useSidebarCollapse();
  const t = useTranslations('sidebar');
  const label = isCollapsed ? t('expandToggle') : t('collapseToggle');
  const { root, icon } = sidebarCollapseToggleVariants({ isCollapsed });

  return (
    <Button
      variant="unstyled"
      onClick={toggle}
      aria-expanded={!isCollapsed}
      aria-label={label}
      title={label}
      className={root({ class: className })}
    >
      <Icon name={ICONS.CHEVRON_RIGHT} className={icon()} />
    </Button>
  );
};
