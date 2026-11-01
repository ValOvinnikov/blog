'use client';

import { Menu } from '@base-ui/react/menu';
import { ICONS } from '@blog/config';
import { NavItemContent } from '@platform/components/features/layout/nav-item-content';
import {
  sidebarVariants,
  type TSidebarNavSection,
} from '@platform/components/features/layout/sidebar';
import { Icon } from '@platform/components/shared/icon';
import { menuSurfaceVariants } from '@platform/components/shared/menu-surface';
import { Link, usePathname } from '@platform/i18n/navigation';
import { isCurrentNavHref } from '@platform/utils/nav-sections/is-current-nav-href';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { topbarNavMenuVariants } from './topbar-nav-menu-variants';

export type TTopbarNavMenuProps = {
  sections: TSidebarNavSection[];
  switcher?: ReactNode;
};

export const TopbarNavMenu = ({ sections, switcher }: TTopbarNavMenuProps) => {
  const t = useTranslations('topbarNavMenu');
  const pathname = usePathname();
  const {
    trigger,
    popup,
    sectionLabel: phoneSectionLabel,
    row: phoneRow,
    note: phoneNote,
  } = topbarNavMenuVariants();
  const { popup: surfacePopup } = menuSurfaceVariants();
  const { switcherSlot, section, sectionLabel, row, note } = sidebarVariants();

  return (
    <Menu.Root>
      <Menu.Trigger
        className={trigger()}
        aria-label={t('triggerLabel')}
        title={t('triggerLabel')}
      >
        <Icon name={ICONS.MENU} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start">
          <Menu.Popup className={surfacePopup({ class: popup() })}>
            {switcher && <div className={switcherSlot()}>{switcher}</div>}

            {sections.map((navSection) => (
              <Menu.Group className={section()} key={navSection.label}>
                <Menu.GroupLabel
                  className={sectionLabel({ class: phoneSectionLabel() })}
                >
                  {navSection.label}
                </Menu.GroupLabel>
                {navSection.items.length > 0
                  ? navSection.items.map((item) => {
                      if (item.href) {
                        const isActive = isCurrentNavHref(item.href, pathname);

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
                              class: phoneRow(),
                            })}
                          >
                            <NavItemContent
                              icon={item.icon}
                              label={item.label}
                              badge={item.badge}
                            />
                          </Menu.LinkItem>
                        );
                      }

                      return (
                        <div
                          key={item.label}
                          className={row({
                            state: 'inert',
                            class: phoneRow(),
                          })}
                        >
                          <NavItemContent
                            icon={item.icon}
                            label={item.label}
                            disabledReason={item.disabledReason}
                            badge={item.badge}
                          />
                        </div>
                      );
                    })
                  : navSection.note && (
                      <p className={note({ class: phoneNote() })}>
                        {navSection.note}
                      </p>
                    )}
              </Menu.Group>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
