'use client';

import { useRender } from '@base-ui/react/use-render';
import { useSidebarCollapse } from '@platform/components/features/layout/sidebar-collapse-provider';
import { Tooltip } from '@platform/components/shared/tooltip';
import type { ReactElement } from 'react';

export type TSidebarRailTooltipProps = {
  label: string;
  row: ReactElement;
  hasNativeTitle?: boolean;
};

// Collapsed, the row drops its native `title` so the shared Tooltip is the only hint shown.
export const SidebarRailTooltip = ({
  label,
  row,
  hasNativeTitle = true,
}: TSidebarRailTooltipProps) => {
  const { isCollapsed } = useSidebarCollapse();
  const titledRow = useRender({
    render: row,
    props: { title: label },
    enabled: !isCollapsed && hasNativeTitle,
  });

  if (titledRow) {
    return titledRow;
  }

  if (!isCollapsed) {
    return row;
  }

  return <Tooltip label={label} side="right" align="center" trigger={row} />;
};
