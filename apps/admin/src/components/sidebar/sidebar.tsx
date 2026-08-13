import Link from 'next/link';
import type { ReactNode } from 'react';

import { sidebarVariants } from './sidebar-variants';

type TSidebarNavItem = {
  label: string;
  href: string;
};

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
 * built tab) is a matter of appending to its `items`, not reshaping this
 * component.
 */
export function Sidebar({ sections, switcher }: TSidebarProps) {
  const {
    root,
    brand,
    brandName,
    brandMeta,
    switcherSlot,
    section,
    sectionLabel,
    list,
    link,
    note,
  } = sidebarVariants();

  return (
    <aside className={root()}>
      <div className={brand()}>
        <span className={brandName()}>Valstack</span>
        <span className={brandMeta()}>admin</span>
      </div>

      {switcher && <div className={switcherSlot()}>{switcher}</div>}

      {sections.map((navSection) => (
        <div className={section()} key={navSection.label}>
          <p className={sectionLabel()}>{navSection.label}</p>
          {navSection.items.length > 0 ? (
            <nav aria-label={navSection.label}>
              <ul className={list()}>
                {navSection.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={link()}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : (
            navSection.note && <p className={note()}>{navSection.note}</p>
          )}
        </div>
      ))}
    </aside>
  );
}
