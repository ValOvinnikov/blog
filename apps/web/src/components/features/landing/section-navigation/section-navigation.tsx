import { routes } from '@shinefold/config';
import type {
  TLandingBreadcrumb,
  TLandingSectionNavigation,
} from '@shinefold/service';
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
  const { title: sectionTitle, root, pages, parentSection } = sectionNavigation;
  const toLink = ({ title, path }: TLandingBreadcrumb) => ({
    label: title,
    href: routes.landingPage(path),
  });
  const items: TSidebarNavItem[] = [
    { ...toLink(root), level: 1 },
    ...pages.map((page) => ({
      ...toLink(page),
      level: 2 as const,
      subItems: page.pages?.map(toLink),
    })),
  ];
  // A group is marked current when the current page sits inside it, so the last match is the page itself.
  const currentPage = [
    root,
    ...pages.flatMap((page) => [page, ...(page.pages ?? [])]),
  ].findLast(({ isCurrent }) => isCurrent);
  const backLink = parentSection && {
    label: parentSection.title,
    href: routes.landingPage(parentSection.path),
    ariaLabel: t('backTo', { title: parentSection.title }),
  };

  return (
    <SidebarNav
      className={className}
      items={items}
      activeKey={currentPage && routes.landingPage(currentPage.path)}
      label={sectionTitle ?? t('label')}
      ariaCurrent="page"
      backLink={backLink}
      hasRootItem={true}
    />
  );
};
