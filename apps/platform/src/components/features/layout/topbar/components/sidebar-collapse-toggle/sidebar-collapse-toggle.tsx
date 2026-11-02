'use client';

import { ICONS } from '@blog/config';
import { useSidebarCollapse } from '@platform/components/features/layout/sidebar-collapse-provider';
import { Icon } from '@platform/components/shared/icon';
import { Tooltip } from '@platform/components/shared/tooltip';
import { ICON_SIZE } from '@platform/constants/icon';
import { SIDEBAR_ID } from '@platform/constants/sidebar';
import { useTranslations } from 'next-intl';

import { sidebarCollapseToggleVariants } from './sidebar-collapse-toggle-variants';

export const SidebarCollapseToggle = () => {
  const { isCollapsed, toggle } = useSidebarCollapse();
  const t = useTranslations('sidebar');
  const label = isCollapsed ? t('expandToggle') : t('collapseToggle');

  return (
    <Tooltip
      label={label}
      trigger={
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!isCollapsed}
          aria-controls={SIDEBAR_ID}
          aria-label={label}
          className={sidebarCollapseToggleVariants()}
        >
          <Icon name={ICONS.SIDEBAR} size={ICON_SIZE.MD} />
        </button>
      }
    />
  );
};
