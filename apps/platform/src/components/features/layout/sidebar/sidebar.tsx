import { SIDEBAR_ID } from '@platform/constants/sidebar';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { SidebarBrand } from './components/sidebar-brand';
import {
  SidebarNavSection,
  type TSidebarNavSection,
} from './components/sidebar-nav-section';
import { sidebarVariants } from './sidebar-variants';

export type TSidebarProps = {
  sections: TSidebarNavSection[];
  switcher?: ReactNode;
  foot?: ReactNode;
};

export const Sidebar = ({ sections, switcher, foot }: TSidebarProps) => {
  const t = useTranslations('sidebar');
  const { root, switcherSlot, navArea, foot: footSlot } = sidebarVariants();

  return (
    <aside id={SIDEBAR_ID} aria-label={t('ariaLabel')} className={root()}>
      <SidebarBrand />
      {switcher && <div className={switcherSlot()}>{switcher}</div>}
      <div className={navArea()}>
        {sections.map((section) => (
          <SidebarNavSection key={section.label} section={section} />
        ))}
      </div>
      {foot && <div className={footSlot()}>{foot}</div>}
    </aside>
  );
};
