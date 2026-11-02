import {
  NavItemContent,
  type TNavItemBadge,
  type TNavItemStatus,
} from '@platform/components/features/layout/nav-item-content';
import { SidebarNavLink } from '@platform/components/features/layout/sidebar/components/sidebar-nav-link';
import { SidebarRailTooltip } from '@platform/components/features/layout/sidebar/components/sidebar-rail-tooltip';
import { sidebarVariants } from '@platform/components/features/layout/sidebar/sidebar-variants';
import type { TRegisteredIconName } from '@platform/components/shared/icon';

type TSidebarNavItemBase = {
  label: string;
  icon: TRegisteredIconName;
  badge?: TNavItemBadge;
  status?: TNavItemStatus;
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
  const { label, icon, badge, status, href, disabledReason } = item;
  const { row } = sidebarVariants();

  return (
    <li>
      <SidebarRailTooltip
        label={label}
        hasNativeTitle={!status}
        row={
          href ? (
            <SidebarNavLink href={href}>
              <NavItemContent
                icon={icon}
                label={label}
                badge={badge}
                status={status}
              />
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
                status={status}
              />
            </div>
          )
        }
      />
    </li>
  );
};
