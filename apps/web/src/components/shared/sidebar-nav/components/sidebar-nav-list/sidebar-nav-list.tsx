import type { TMaybeUndefined } from '@shinefold/config';
import { SidebarNavLink } from '@web/components/shared/sidebar-nav/components/sidebar-nav-list/components/sidebar-nav-link/sidebar-nav-link';
import type {
  TSidebarNavAriaCurrent,
  TSidebarNavItem,
  TSidebarNavLink,
} from '@web/components/shared/sidebar-nav/types';

import { sidebarNavListVariants } from './sidebar-nav-list-variants';

interface ISidebarNavListProps {
  items: TSidebarNavItem[];
  activeItem: TMaybeUndefined<TSidebarNavLink>;
  ariaCurrent: TSidebarNavAriaCurrent;
  hasRootItem: boolean;
  isInPanel?: boolean;
  onNavigate?: () => void;
}

const s = sidebarNavListVariants();

export const SidebarNavList = ({
  items,
  activeItem,
  ariaCurrent,
  hasRootItem,
  isInPanel = false,
  onNavigate,
}: ISidebarNavListProps) => (
  <ol className={s.list()}>
    {items.map((item) => {
      const isNested = item.level === 2;
      const isActive = item === activeItem;

      return (
        <li key={item.href}>
          <SidebarNavLink
            link={item}
            ariaCurrent={isActive ? ariaCurrent : undefined}
            className={s.link({
              isActive,
              isNested,
              isRoot: hasRootItem && !isNested,
              isInPanel,
            })}
            onNavigate={onNavigate}
          />
          {item.subItems && (
            <ol className={s.subList()}>
              {item.subItems.map((subItem) => {
                const isSubItemActive = subItem === activeItem;

                return (
                  <li key={subItem.href}>
                    <SidebarNavLink
                      link={subItem}
                      ariaCurrent={isSubItemActive ? ariaCurrent : undefined}
                      className={s.link({
                        isActive: isSubItemActive,
                        isRoot: false,
                        isSubItem: true,
                        isInPanel,
                      })}
                      onNavigate={onNavigate}
                    />
                  </li>
                );
              })}
            </ol>
          )}
        </li>
      );
    })}
  </ol>
);
