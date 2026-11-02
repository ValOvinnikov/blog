'use client';

import {
  NavItemContent,
  type TNavItemContentProps,
} from '@platform/components/features/layout/nav-item-content';
import { useSidebarCollapse } from '@platform/components/features/layout/sidebar-collapse-provider';

export type TSidebarNavItemContentProps = Omit<
  TNavItemContentProps,
  'isCollapsed'
>;

export const SidebarNavItemContent = (props: TSidebarNavItemContentProps) => {
  const { isCollapsed } = useSidebarCollapse();

  return <NavItemContent {...props} isCollapsed={isCollapsed} />;
};
