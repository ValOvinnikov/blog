'use client';

import { Menu } from '@base-ui/react/menu';
import { ICONS, SIZE } from '@blog/config';
import {
  sidebarVariants,
  type TSidebarNavSection,
} from '@platform/components/features/layout/sidebar';
import { Icon } from '@platform/components/shared/icon';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Link, usePathname } from '@platform/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { topbarNavMenuVariants } from './topbar-nav-menu-variants';

export type TTopbarNavMenuProps = {
  sections: TSidebarNavSection[];
  /** e.g. the tenant switcher, rendered above the nav sections — same slot the desktop sidebar gives it. */
  switcher?: ReactNode;
};

/**
 * The mobile stand-in for `Sidebar`: a compact Topbar trigger that reveals
 * the same nav sections (and tenant switcher) in an on-demand popup instead
 * of an always-expanded stack, so nav stays reachable without an unbounded
 * sticky block ever covering page content. Reuses `sidebarVariants`' own
 * row/section styling so the popup reads as the same nav, not a second
 * design.
 */
export const TopbarNavMenu = ({ sections, switcher }: TTopbarNavMenuProps) => {
  const t = useTranslations('topbarNavMenu');
  const pathname = usePathname();
  const { trigger, popup } = topbarNavMenuVariants();
  const {
    switcherSlot,
    section,
    sectionLabel,
    row,
    rowIcon,
    rowBody,
    rowLabel,
    rowReason,
    badgeSlot,
    note,
  } = sidebarVariants();

  return (
    <Menu.Root>
      <Menu.Trigger
        className={trigger()}
        aria-label={t('triggerLabel')}
        title={t('triggerLabel')}
      >
        <Icon name={ICONS.MENU} size={SIZE.SM} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start">
          <Menu.Popup className={popup()}>
            {switcher && <div className={switcherSlot()}>{switcher}</div>}

            {sections.map((navSection) => (
              <Menu.Group className={section()} key={navSection.label}>
                <Menu.GroupLabel className={sectionLabel()}>
                  {navSection.label}
                </Menu.GroupLabel>
                {navSection.items.length > 0
                  ? navSection.items.map((item) => {
                      const badge = item.badge && (
                        <StatusBadge
                          tone={item.badge.tone}
                          className={badgeSlot()}
                        >
                          {item.badge.label}
                        </StatusBadge>
                      );

                      if (item.href) {
                        const isActive = pathname === item.href;

                        return (
                          <Menu.LinkItem
                            key={item.label}
                            closeOnClick={true}
                            render={
                              <Link
                                href={item.href}
                                aria-current={isActive ? 'page' : undefined}
                              />
                            }
                            className={row({
                              state: isActive ? 'active' : 'resting',
                            })}
                          >
                            <Icon
                              name={item.icon}
                              size={SIZE.SM}
                              className={rowIcon()}
                            />
                            <span className={rowBody()}>
                              <span className={rowLabel()}>{item.label}</span>
                            </span>
                            {badge}
                          </Menu.LinkItem>
                        );
                      }

                      return (
                        <div
                          key={item.label}
                          className={row({ state: 'inert' })}
                        >
                          <Icon
                            name={item.icon}
                            size={SIZE.SM}
                            className={rowIcon()}
                          />
                          <span className={rowBody()}>
                            <span className={rowLabel()}>{item.label}</span>
                            {item.disabledReason && (
                              <span className={rowReason()}>
                                {item.disabledReason}
                              </span>
                            )}
                          </span>
                          {badge}
                        </div>
                      );
                    })
                  : navSection.note && (
                      <p className={note()}>{navSection.note}</p>
                    )}
              </Menu.Group>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
