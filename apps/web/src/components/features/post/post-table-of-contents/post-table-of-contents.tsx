'use client';

import {
  SidebarNav,
  type TSidebarNavItem,
} from '@web/components/shared/sidebar-nav';
import { useActiveHeadingId } from '@web/hooks/use-active-heading-id';
import type { TPostHeading } from '@web/utils/extract-post-headings/extract-post-headings';
import { useTranslations } from 'next-intl';

export type TPostTableOfContentsProps = {
  headings: TPostHeading[];
  className?: string;
};

const toAnchor = (key: string) => `#${key}`;

export const PostTableOfContents = ({
  headings,
  className,
}: TPostTableOfContentsProps) => {
  const t = useTranslations('postContentsRail');
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
