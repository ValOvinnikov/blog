import { routes } from '@blog/config';
import type { TLandingSectionNavigation } from '@blog/service';
import {
  SidebarNav,
  type TSidebarNavItem,
} from '@web/components/shared/sidebar-nav';
import { useTranslations } from 'next-intl';

export type TSectionNavigationProps = {
  sectionNavigation: TLandingSectionNavigation;
  className?: string;
};

export const SectionNavigation = ({
  sectionNavigation,
  className,
}: TSectionNavigationProps) => {
  const t = useTranslations('sectionNavigation');
  const { title: sectionTitle, root, pages } = sectionNavigation;
  const sectionPages = [
    { ...root, level: 1 as const },
    ...pages.map((page) => ({ ...page, level: 2 as const })),
  ];
  const items: TSidebarNavItem[] = sectionPages.map(
    ({ title, path, level }) => ({
      label: title,
      href: routes.landingPage(path),
      level,
    }),
  );
  const currentPage = sectionPages.find(({ isCurrent }) => isCurrent);

  return (
    <SidebarNav
      className={className}
      items={items}
      activeKey={currentPage && routes.landingPage(currentPage.path)}
      label={sectionTitle ?? t('label')}
      ariaCurrent="page"
    />
  );
};
