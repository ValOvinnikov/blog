import type { TMaybeUndefined } from '@shinefold/config';
import { hasLength } from '@shinefold/utils/primitives';

import type { TRawLandingPage } from './query';
import type {
  TLandingBreadcrumb,
  TLandingSectionNavigation,
  TLandingSectionNavigationPage,
  TLandingSectionPage,
} from './types';

type TRawSectionChain = TRawLandingPage['sectionChain'];

type TRawSectionRoot = TRawSectionChain[number];

export type TRawSectionPage = Pick<TRawSectionRoot, '_id' | 'title' | 'path'>;

export type TRawSectionTreePage = NonNullable<
  TRawSectionRoot['children']
>[number];

export function toBreadcrumb({
  title,
  path,
}: TRawSectionPage): TMaybeUndefined<TLandingBreadcrumb> {
  return title && path ? { title, path } : undefined;
}

function toSectionPage(
  raw: TRawSectionPage,
  isCurrent: boolean,
): TMaybeUndefined<TLandingSectionPage> {
  const breadcrumb = toBreadcrumb(raw);

  return breadcrumb && { ...breadcrumb, isCurrent };
}

export function findSectionRootIndex(sectionChain: TRawSectionChain): number {
  const topIndex = sectionChain
    .map((page) => page.sectionNavigation && page.showSubPagesInNavigation)
    .lastIndexOf(true);

  return topIndex < 0
    ? sectionChain.findIndex((page) => page.sectionNavigation)
    : topIndex;
}

function toNavigationPage(
  child: TRawSectionTreePage,
  currentBranchIds: Set<string>,
  showSubPages: boolean,
): TMaybeUndefined<TLandingSectionNavigationPage> {
  const page = toSectionPage(child, currentBranchIds.has(child._id));
  if (!page || !showSubPages) return page;

  const pages = (child.children ?? []).flatMap(
    (sub) => toSectionPage(sub, currentBranchIds.has(sub._id)) ?? [],
  );

  return hasLength(pages) ? { ...page, pages } : page;
}

export function toSectionNavigation({
  sectionChain,
  showSectionNavigation,
}: TRawLandingPage): TMaybeUndefined<TLandingSectionNavigation> {
  if (showSectionNavigation === false) return undefined;

  const rootIndex = findSectionRootIndex(sectionChain);
  const sectionRoot = sectionChain[rootIndex];
  const root = sectionRoot && toSectionPage(sectionRoot, rootIndex === 0);
  if (!sectionRoot || !root) return undefined;

  const parentSection = sectionChain
    .slice(rootIndex + 1)
    .find((page) => page.sectionNavigation);
  const currentBranchIds = new Set(
    sectionChain.slice(0, rootIndex).map(({ _id }) => _id),
  );

  return {
    title: sectionRoot.sectionNavigationTitle?.trim() || null,
    root,
    pages: (sectionRoot.children ?? []).flatMap(
      (child) =>
        toNavigationPage(
          child,
          currentBranchIds,
          sectionRoot.showSubPagesInNavigation,
        ) ?? [],
    ),
    breadcrumbs: [...sectionChain]
      .reverse()
      .flatMap((page) => toBreadcrumb(page) ?? []),
    parentSection: parentSection && toBreadcrumb(parentSection),
  };
}
