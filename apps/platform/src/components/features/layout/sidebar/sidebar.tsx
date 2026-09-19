import type { TIconName } from '@blog/config';
import { NavItemContent } from '@platform/components/features/layout/nav-item-content';
import { BrandMark } from '@platform/components/shared/brand-mark';
import type { TStatusBadgeProps } from '@platform/components/shared/status-badge';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { SidebarCollapseToggle } from './components/sidebar-collapse-toggle';
import { SidebarNavLink } from './sidebar-nav-link';
import { sidebarVariants } from './sidebar-variants';

type TSidebarNavBadge = {
  label: string;
  tone: TStatusBadgeProps['tone'];
  hasDot?: boolean;
};

type TSidebarNavItemBase = {
  label: string;
  icon: TIconName;
  badge?: TSidebarNavBadge;
};

/**
 * An item either links somewhere — its active state is detected from the
 * current route, not passed in — or, with no `href`, renders as an inert
 * row. Never an `<a>` with nowhere to go.
 */
type TSidebarNavItem = TSidebarNavItemBase &
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

/**
 * The persistent nav shell for both the Platform and Tenant sections. Each
 * caller supplies only the sections it's authorized to show — the component
 * itself carries no authorization logic. Growing a section (e.g. adding a
 * built tab) is a matter of appending an item, not reshaping this component.
 */
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
          <p className={sectionLabel()}>{navSection.label}</p>
          {navSection.items.length > 0 ? (
            <nav aria-label={navSection.label}>
              <ul className={list()}>
                {navSection.items.map((item) => {
                  if (item.href) {
                    return (
                      <li key={item.label}>
                        <SidebarNavLink href={item.href}>
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
                      <div className={row({ state: 'inert' })}>
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
