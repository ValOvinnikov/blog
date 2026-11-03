'use client';

import { Menu } from '@base-ui/react/menu';
import { ICONS, type TMaybeNull } from '@blog/config';
import { hasArrayGotItems } from '@blog/utils/primitives';
import { NavItemContent } from '@platform/components/features/layout/nav-item-content';
import type { TSidebarNavSection } from '@platform/components/features/layout/sidebar';
import { sidebarVariants } from '@platform/components/features/layout/sidebar/sidebar-variants';
import { Icon } from '@platform/components/shared/icon';
import { menuSurfaceVariants } from '@platform/components/shared/menu-surface';
import { NestedMenuProvider } from '@platform/context/nested-menu-provider';
import { Link, usePathname } from '@platform/i18n/navigation';
import { isCurrentNavHref } from '@platform/utils/nav-sections/is-current-nav-href';
import { useTranslations } from 'next-intl';
import type { ReactNode, RefObject } from 'react';

import { topbarNavMenuVariants } from './topbar-nav-menu-variants';
import { useBarAnchor } from './use-bar-anchor';

export type TTopbarNavMenuProps = {
  sections: TSidebarNavSection[];
  switcher?: ReactNode;
  account: ReactNode;
  barRef: RefObject<TMaybeNull<HTMLElement>>;
};

const POPUP_GAP_BELOW_BAR = 5;
const POPUP_VIEWPORT_MARGIN = 12;

export const TopbarNavMenu = ({
  sections,
  switcher,
  account,
  barRef,
}: TTopbarNavMenuProps) => {
  const t = useTranslations('topbarNavMenu');
  const pathname = usePathname();
  const { triggerRef, anchor } = useBarAnchor(barRef);
  const {
    trigger,
    popup,
    topZone,
    middleZone,
    footZone,
    section,
    sectionLabel: phoneSectionLabel,
    row,
    note: phoneNote,
  } = topbarNavMenuVariants();
  const { sectionLabel, note } = sidebarVariants();
  const { popup: surfacePopup } = menuSurfaceVariants();

  return (
    <Menu.Root>
      <Menu.Trigger
        ref={triggerRef}
        className={trigger()}
        aria-label={t('triggerLabel')}
        title={t('triggerLabel')}
      >
        <Icon name={ICONS.MENU} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          anchor={anchor}
          sideOffset={POPUP_GAP_BELOW_BAR}
          collisionPadding={POPUP_VIEWPORT_MARGIN}
          align="start"
        >
          <Menu.Popup className={surfacePopup({ class: popup() })}>
            <NestedMenuProvider>
              {switcher && <div className={topZone()}>{switcher}</div>}

              <div className={middleZone()}>
                {sections.map((navSection) => (
                  <Menu.Group className={section()} key={navSection.label}>
                    <Menu.GroupLabel
                      className={sectionLabel({ class: phoneSectionLabel() })}
                    >
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
                          <p className={note({ class: phoneNote() })}>
                            {navSection.note}
                          </p>
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
