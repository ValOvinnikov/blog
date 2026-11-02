'use client';

import { useRender } from '@base-ui/react/use-render';
import { sidebarVariants } from '@platform/components/features/layout/sidebar/sidebar-variants';
import { useSidebarCollapse } from '@platform/components/features/layout/sidebar-collapse-provider';
import { Tooltip } from '@platform/components/shared/tooltip';
import { useTranslations } from 'next-intl';
import { useId, type ReactElement } from 'react';

export type TSidebarRailTooltipProps = {
  label: string;
  row: ReactElement;
  statusText?: string;
};

// Collapsed, the row drops its native `title` so the shared Tooltip is the only hint shown.
export const SidebarRailTooltip = ({
  label,
  row,
  statusText,
}: TSidebarRailTooltipProps) => {
  const t = useTranslations('navSections');
  const { isCollapsed } = useSidebarCollapse();
  const descriptionId = useId();
  const { railDescription } = sidebarVariants();
  const titledRow = useRender({
    render: row,
    props: { title: label },
    enabled: !isCollapsed && !statusText,
  });
  const describedRow = useRender({
    render: row,
    props: { 'aria-describedby': descriptionId },
    enabled: isCollapsed && !!statusText,
  });

  if (titledRow) {
    return titledRow;
  }

  if (!isCollapsed) {
    return row;
  }

  if (!describedRow || !statusText) {
    return <Tooltip label={label} side="right" align="center" trigger={row} />;
  }

  const statusLabel = t('collapsedStatusTooltip', {
    label,
    status: statusText,
  });

  return (
    <>
      <Tooltip
        label={statusLabel}
        side="right"
        align="center"
        trigger={describedRow}
      />
      <span id={descriptionId} className={railDescription()}>
        {statusLabel}
      </span>
    </>
  );
};
