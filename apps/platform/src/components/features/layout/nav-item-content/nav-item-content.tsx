import { NavItemRailBadge } from '@platform/components/features/layout/nav-item-content/components/nav-item-rail-badge';
import {
  NavItemStatus,
  type TNavItemStatus,
} from '@platform/components/features/layout/nav-item-content/components/nav-item-status';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import {
  StatusBadge,
  type TStatusBadgeProps,
} from '@platform/components/shared/status-badge';

import { navItemContentVariants } from './nav-item-content-variants';

export type TNavItemBadge = {
  label: string;
  tone: TStatusBadgeProps['tone'];
  hasDot?: boolean;
};

export type TNavItemContentProps = {
  icon: TRegisteredIconName;
  label: string;
  disabledReason?: string;
  badge?: TNavItemBadge;
  status?: TNavItemStatus;
  isCollapsed?: boolean;
};

export const NavItemContent = ({
  icon,
  label,
  disabledReason,
  badge,
  status,
  isCollapsed = false,
}: TNavItemContentProps) => {
  const railStatus = isCollapsed ? status : undefined;
  const lineStatus = isCollapsed ? undefined : status;
  const { rowIcon, rowBody, rowLabel, rowReason, badgeSlot, iconFrame } =
    navItemContentVariants({
      hasStatus: !!lineStatus,
      hasRailBadge: !!railStatus,
      hasNeutralBadge: badge?.tone === 'neutral',
    });

  const rowIconElement = <Icon name={icon} className={rowIcon()} />;

  return (
    <>
      {railStatus ? (
        <span className={iconFrame()}>
          {rowIconElement}
          <NavItemRailBadge status={railStatus} />
        </span>
      ) : (
        rowIconElement
      )}
      <span className={rowBody()}>
        <span className={rowLabel()}>{label}</span>
        {disabledReason && (
          <span className={rowReason()}>{disabledReason}</span>
        )}
        {lineStatus && <NavItemStatus status={lineStatus} />}
      </span>
      {badge && (
        <StatusBadge
          tone={badge.tone}
          hasDot={badge.hasDot}
          className={badgeSlot()}
        >
          {badge.label}
        </StatusBadge>
      )}
    </>
  );
};
