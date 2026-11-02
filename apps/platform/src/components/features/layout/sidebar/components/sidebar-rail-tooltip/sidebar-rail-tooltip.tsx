'use client';

import { useRender } from '@base-ui/react/use-render';
import { useSidebarCollapse } from '@platform/components/features/layout/sidebar-collapse-provider';
import { Tooltip } from '@platform/components/shared/tooltip';
import type { ReactElement } from 'react';

export type TSidebarRailTooltipProps = {
  label: string;
  row: ReactElement;
};

// Collapsed, the row drops its native `title` so the shared Tooltip is the only hint shown.
export const SidebarRailTooltip = ({
  label,
  row,
}: TSidebarRailTooltipProps) => {
  const { isCollapsed } = useSidebarCollapse();
  const titledRow = useRender({
    render: row,
    props: { title: label },
    enabled: !isCollapsed,
  });

  if (titledRow) {
    return titledRow;
  }

  return <Tooltip label={label} side="right" align="center" trigger={row} />;
};
