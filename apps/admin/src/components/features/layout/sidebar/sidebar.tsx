import { Size, type TIconName } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import { Icon } from '@blog/ui/atoms/icon';
import {
  StatusBadge,
  type TStatusBadgeProps,
} from '@blog/ui/atoms/status-badge';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { SidebarNavLink } from './sidebar-nav-link';
import { sidebarVariants } from './sidebar-variants';

type TSidebarNavBadge = {
  label: string;
  tone: TStatusBadgeProps['tone'];
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
  /**
   * Shown in place of the item list when `items` is empty — states why
   * there's nothing to link to yet, instead of a dead nav link.
   */
  note?: string;
};

export type TSidebarProps = {
  sections: TSidebarNavSection[];
  /** e.g. the tenant switcher, rendered above the nav sections. */
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
    switcherSlot,
    section,
    sectionLabel,
    list,
    row,
    rowBody,
    rowLabel,
    rowReason,
    badgeSlot,
    note,
  } = sidebarVariants();

  return (
    <aside className={root()}>
      <div className={brand()}>
        <span aria-hidden="true">
          <Avatar name={t('brandName')} alt={t('brandName')} size={Size.SM} />
        </span>
        <div className={brandMeta()}>
          <span className={brandName()}>{t('brandName')}</span>
          <span className={brandTagline()}>{t('brandTagline')}</span>
        </div>
      </div>

      {switcher && <div className={switcherSlot()}>{switcher}</div>}

      {sections.map((navSection) => (
        <div className={section()} key={navSection.label}>
          <p className={sectionLabel()}>{navSection.label}</p>
          {navSection.items.length > 0 ? (
            <nav aria-label={navSection.label}>
              <ul className={list()}>
                {navSection.items.map((item) => {
                  const badge = item.badge && (
                    <StatusBadge tone={item.badge.tone} className={badgeSlot()}>
                      {item.badge.label}
                    </StatusBadge>
                  );

                  if (item.href) {
                    return (
                      <li key={item.label}>
                        <SidebarNavLink href={item.href}>
                          <Icon name={item.icon} size={Size.SM} />
                          <span className={rowBody()}>
                            <span className={rowLabel()}>{item.label}</span>
                          </span>
                          {badge}
                        </SidebarNavLink>
                      </li>
                    );
                  }

                  return (
                    <li key={item.label}>
                      <div className={row({ state: 'inert' })}>
                        <Icon name={item.icon} size={Size.SM} />
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
