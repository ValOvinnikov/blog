'use client';

import type { IWithClassName } from '@blog/config';
import {
  SidebarNav,
  type TSidebarNavItem,
} from '@web/components/shared/sidebar-nav';
import { useActiveHeadingId } from '@web/hooks/use-active-heading-id';
import type { TContentsHeading } from '@web/utils/extract-contents-headings';
import { useTranslations } from 'next-intl';

export interface IContentsRailProps extends IWithClassName {
  headings: TContentsHeading[];
}

const toAnchor = (key: string) => `#${key}`;

export const ContentsRail = ({ headings, className }: IContentsRailProps) => {
  const t = useTranslations('contentsRail');
  const activeHeadingId = useActiveHeadingId(headings.map(({ key }) => key));
  const items: TSidebarNavItem[] = headings.map(({ text, level, key }) => ({
    label: text,
    href: toAnchor(key),
    level: level === 3 ? 2 : 1,
  }));
  const activeKey = activeHeadingId ?? headings[0]?.key;

  return (
    <SidebarNav
      className={className}
      items={items}
      activeKey={activeKey && toAnchor(activeKey)}
      label={t('label')}
      ariaCurrent="location"
    />
  );
};
