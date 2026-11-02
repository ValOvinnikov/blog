import {
  NavItemContent,
  type TNavItemBadge,
} from '@platform/components/features/layout/nav-item-content';
import { SidebarNavLink } from '@platform/components/features/layout/sidebar/components/sidebar-nav-link';
import { SidebarRailTooltip } from '@platform/components/features/layout/sidebar/components/sidebar-rail-tooltip';
import { sidebarVariants } from '@platform/components/features/layout/sidebar/sidebar-variants';
import type { TRegisteredIconName } from '@platform/components/shared/icon';

type TSidebarNavItemBase = {
  label: string;
  icon: TRegisteredIconName;
  badge?: TNavItemBadge;
};

export type TSidebarNavItem = TSidebarNavItemBase &
  (
    | { href: string; disabledReason?: never }
    | { href?: undefined; disabledReason?: string }
  );

export type TSidebarNavItemProps = {
  item: TSidebarNavItem;
};

export const SidebarNavItem = ({ item }: TSidebarNavItemProps) => {
  const { label, icon, badge, href, disabledReason } = item;
  const { row } = sidebarVariants();

  return (
    <li>
      <SidebarRailTooltip
        label={label}
        row={
          href ? (
            <SidebarNavLink href={href}>
              <NavItemContent icon={icon} label={label} badge={badge} />
            </SidebarNavLink>
          ) : (
            <div
              role="link"
              aria-disabled="true"
              className={row({ state: 'inert' })}
            >
              <NavItemContent
                icon={icon}
                label={label}
                disabledReason={disabledReason}
                badge={badge}
              />
            </div>
          )
        }
      />
    </li>
  );
};
