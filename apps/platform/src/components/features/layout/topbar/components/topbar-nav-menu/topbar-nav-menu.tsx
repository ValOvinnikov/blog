'use client';

import { Menu } from '@base-ui/react/menu';
import { ICONS } from '@blog/config';
import { hasArrayGotItems } from '@blog/utils/primitives';
import { NavItemContent } from '@platform/components/features/layout/nav-item-content';
import type { TSidebarNavSection } from '@platform/components/features/layout/sidebar';
import { Icon } from '@platform/components/shared/icon';
import { menuSurfaceVariants } from '@platform/components/shared/menu-surface';
import { NestedMenuProvider } from '@platform/context/nested-menu-provider';
import { Link, usePathname } from '@platform/i18n/navigation';
import { isCurrentNavHref } from '@platform/utils/nav-sections/is-current-nav-href';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { topbarNavMenuVariants } from './topbar-nav-menu-variants';

export type TTopbarNavMenuProps = {
  sections: TSidebarNavSection[];
  switcher?: ReactNode;
  account: ReactNode;
};

// The Menu button spans y 11–55 of the 67px top bar; the popup opens 5px below the bar.
const POPUP_SIDE_OFFSET = 17;

export const TopbarNavMenu = ({
  sections,
  switcher,
  account,
}: TTopbarNavMenuProps) => {
  const t = useTranslations('topbarNavMenu');
  const pathname = usePathname();
  const {
    trigger,
    popup,
    topZone,
    middleZone,
    footZone,
    section,
    sectionLabel,
    row,
    note,
  } = topbarNavMenuVariants();
  const { popup: surfacePopup } = menuSurfaceVariants();

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
        <Menu.Positioner sideOffset={POPUP_SIDE_OFFSET} align="start">
          <Menu.Popup className={surfacePopup({ class: popup() })}>
            <NestedMenuProvider>
              {switcher && <div className={topZone()}>{switcher}</div>}

              <div className={middleZone()}>
                {sections.map((navSection) => (
                  <Menu.Group className={section()} key={navSection.label}>
                    <Menu.GroupLabel className={sectionLabel()}>
                      {navSection.label}
                    </Menu.GroupLabel>
                    {hasArrayGotItems(navSection.items)
                      ? navSection.items.map((item) => {
                          if (item.href) {
                            const isCurrent = isCurrentNavHref(
                              item.href,
                              pathname,
                            );

                            return (
                              <Menu.LinkItem
                                key={item.label}
                                closeOnClick={true}
                                render={
                                  <Link
                                    href={item.href}
                                    title={item.status ? undefined : item.label}
                                    aria-current={
                                      isCurrent ? 'page' : undefined
                                    }
                                  />
                                }
                                className={row({
                                  state: isCurrent ? 'current' : 'resting',
                                })}
                              >
                                <NavItemContent
                                  icon={item.icon}
                                  label={item.label}
                                  badge={item.badge}
                                  status={item.status}
                                />
                              </Menu.LinkItem>
                            );
                          }

                          return (
                            <div
                              key={item.label}
                              role="menuitem"
                              aria-disabled="true"
                              title={item.label}
                              className={row({ state: 'inert' })}
                            >
                              <NavItemContent
                                icon={item.icon}
                                label={item.label}
                                disabledReason={item.disabledReason}
                                badge={item.badge}
                                status={item.status}
                              />
                            </div>
                          );
                        })
                      : navSection.note && (
                          <p className={note()}>{navSection.note}</p>
                        )}
                  </Menu.Group>
                ))}
              </div>

              <div className={footZone()}>{account}</div>
            </NestedMenuProvider>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
