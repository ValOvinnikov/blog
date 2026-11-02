import type { TNavItemStatus } from '@platform/components/features/layout/nav-item-content/components/nav-item-status';
import { navItemContentVariants } from '@platform/components/features/layout/nav-item-content/nav-item-content-variants';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';

export type TNavItemRailBadgeProps = {
  status: TNavItemStatus;
};

export const NavItemRailBadge = ({ status }: TNavItemRailBadgeProps) => {
  const { icon, tone } = status;
  const { railBadge } = navItemContentVariants({ tone });

  return (
    <span aria-hidden="true" className={railBadge()}>
      <Icon
        name={icon}
        size={ICON_SIZE.XXXS}
        strokeWidth={ICON_STROKE_WIDTH.RAIL_BADGE}
      />
    </span>
  );
};
