import type { TMaybeUndefined } from '@blog/config';
import type { TBreadcrumbItem } from '@platform/components/shared/breadcrumbs/breadcrumbs';

export type TCrumbLink = { label: string; href: string };

type TCrumbGroup = {
  label: TMaybeUndefined<string>;
  links: TCrumbLink[];
};

/** Splits a run of crumbs into menu groups, each page-less crumb heading the links after it. */
export const groupCrumbs = (items: TBreadcrumbItem[]): TCrumbGroup[] =>
  items.reduce<TCrumbGroup[]>((groups, { label, href }) => {
    if (!href) {
      return [...groups, { label, links: [] }];
    }
    const last = groups.at(-1);
    if (!last) {
      return [{ label: undefined, links: [{ label, href }] }];
    }
    return [
      ...groups.slice(0, -1),
      { ...last, links: [...last.links, { label, href }] },
    ];
  }, []);
