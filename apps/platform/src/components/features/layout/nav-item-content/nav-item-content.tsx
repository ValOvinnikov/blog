import { SIZE, type TIconName } from '@blog/config';
import { sidebarVariants } from '@platform/components/features/layout/sidebar';
import { Icon } from '@platform/components/shared/icon';
import {
  StatusBadge,
  type TStatusBadgeProps,
} from '@platform/components/shared/status-badge';

export type TNavItemContentProps = {
  icon: TIconName;
  label: string;
  disabledReason?: string;
  badge?: {
    label: string;
    tone: TStatusBadgeProps['tone'];
    hasDot?: boolean;
  };
};

export const NavItemContent = ({
  icon,
  label,
  disabledReason,
  badge,
}: TNavItemContentProps) => {
  const { rowIcon, rowBody, rowLabel, rowReason, badgeSlot } =
    sidebarVariants();

  return (
    <>
      <Icon name={icon} size={SIZE.SM} className={rowIcon()} />
      <span className={rowBody()}>
        <span className={rowLabel()}>{label}</span>
        {disabledReason && (
          <span className={rowReason()}>{disabledReason}</span>
        )}
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
