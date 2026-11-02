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
};

export const NavItemContent = ({
  icon,
  label,
  disabledReason,
  badge,
  status,
}: TNavItemContentProps) => {
  const { rowIcon, rowBody, rowLabel, rowReason, badgeSlot } =
    navItemContentVariants({ hasStatus: !!status });

  return (
    <>
      <Icon name={icon} className={rowIcon()} />
      <span className={rowBody()}>
        <span className={rowLabel()}>{label}</span>
        {disabledReason && (
          <span className={rowReason()}>{disabledReason}</span>
        )}
        {status && <NavItemStatus status={status} />}
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
