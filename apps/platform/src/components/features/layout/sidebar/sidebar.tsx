import {
  NavItemContent,
  type TNavItemBadge,
} from '@platform/components/features/layout/nav-item-content';
import { BrandMark } from '@platform/components/shared/brand-mark';
import type { TRegisteredIconName } from '@platform/components/shared/icon';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { SidebarCollapseToggle } from './components/sidebar-collapse-toggle';
import { SidebarNavLink } from './components/sidebar-nav-link';
import { sidebarVariants } from './sidebar-variants';

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

export type TSidebarNavSection = {
  label: string;
  items: TSidebarNavItem[];
  note?: string;
};

export type TSidebarProps = {
  sections: TSidebarNavSection[];
  switcher?: ReactNode;
};

export const Sidebar = ({ sections, switcher }: TSidebarProps) => {
  const t = useTranslations('sidebar');
  const {
    root,
    brand,
    brandMeta,
    brandName,
    brandTagline,
    toggle,
    switcherSlot,
    section,
    sectionLabel,
    list,
    row,
    note,
  } = sidebarVariants();

  return (
    <aside className={root()}>
      <div className={brand()}>
        <BrandMark />
        <div className={brandMeta()}>
          <span className={brandName()}>{t('brandName')}</span>
          <span className={brandTagline()}>{t('brandTagline')}</span>
        </div>
        <SidebarCollapseToggle className={toggle()} />
      </div>

      {switcher && <div className={switcherSlot()}>{switcher}</div>}

      {sections.map((navSection) => (
        <div className={section()} key={navSection.label}>
          <p className={sectionLabel()} title={navSection.label}>
            {navSection.label}
          </p>
          {navSection.items.length > 0 ? (
            <nav aria-label={navSection.label}>
              <ul className={list()}>
                {navSection.items.map((item) => {
                  if (item.href) {
                    return (
                      <li key={item.label}>
                        <SidebarNavLink href={item.href} title={item.label}>
                          <NavItemContent
                            icon={item.icon}
                            label={item.label}
                            badge={item.badge}
                          />
                        </SidebarNavLink>
                      </li>
                    );
                  }

                  return (
                    <li key={item.label}>
                      <div
                        role="link"
                        aria-disabled="true"
                        className={row({ state: 'inert' })}
                        title={item.label}
                      >
                        <NavItemContent
                          icon={item.icon}
                          label={item.label}
                          disabledReason={item.disabledReason}
                          badge={item.badge}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : (
            navSection.note && <p className={note()}>{navSection.note}</p>
          )}
        </div>
      ))}
    </aside>
  );
};
