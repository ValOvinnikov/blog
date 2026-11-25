import type { TMaybeUndefined } from '@shinefold/config';
import { toPageTranslations } from '@shinefold/service/shared/localization/page-translations/to-page-translations';
import { toHeadingAlignment } from '@shinefold/service/shared/transformers/heading-block/to-heading-alignment';
import { toHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@shinefold/service/shared/transformers/module/to-module';
import { resolveSeo } from '@shinefold/service/shared/transformers/seo/resolve-seo';
import type { InferResultType } from 'groqd';

import type { landingPageQuery } from './query';
import type {
  TLandingAdjacentPages,
  TLandingBreadcrumb,
  TLandingPageDocument,
  TLandingSectionNavigation,
  TLandingSectionPage,
} from './types';

export type TRawLandingPage = NonNullable<
  InferResultType<typeof landingPageQuery>
>;

type TRawSectionRoot = TRawLandingPage['sectionChain'][number];

type TRawSectionPage = Pick<TRawSectionRoot, '_id' | 'title' | 'path'>;

type TRawSectionTreePage = NonNullable<TRawSectionRoot['children']>[number];

function toBreadcrumb({
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

function toSectionNavigation({
  sectionChain,
  showSectionNavigation,
}: TRawLandingPage): TMaybeUndefined<TLandingSectionNavigation> {
  if (showSectionNavigation === false) return undefined;

  const rootIndex = sectionChain.findIndex((page) => page.sectionNavigation);
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
      (child) => toSectionPage(child, currentBranchIds.has(child._id)) ?? [],
    ),
    breadcrumbs: [...sectionChain]
      .reverse()
      .flatMap((page) => toBreadcrumb(page) ?? []),
    parentSection: parentSection && toBreadcrumb(parentSection),
  };
}

function toReadingOrder(
  page: TRawSectionPage & { children?: TRawSectionTreePage[] | null },
): TRawSectionPage[] {
  return [page, ...(page.children ?? []).flatMap(toReadingOrder)];
}

function toAdjacentPages({
  sectionChain,
  showSectionNavigation,
}: TRawLandingPage): TMaybeUndefined<TLandingAdjacentPages> {
  const [current] = sectionChain;
  const sectionRoot = sectionChain.find((page) => page.sectionNavigation);
  if (
    showSectionNavigation === false ||
    !current ||
    !sectionRoot?.showPreviousNextLinks
  ) {
    return undefined;
  }

  const pages = toReadingOrder(sectionRoot).filter(
    (page) => page._id === current._id || toBreadcrumb(page),
  );
  const index = pages.findIndex(({ _id }) => _id === current._id);
  if (index < 0) return undefined;

  const previous = pages[index - 1];
  const next = pages[index + 1];
  if (!previous && !next) return undefined;

  return {
    previous: previous && toBreadcrumb(previous),
    next: next && toBreadcrumb(next),
  };
}

export function toLandingPage(raw: TRawLandingPage): TLandingPageDocument {
  return {
    id: raw._id,
    path: raw.path,
    headingBlock: toHeadingBlock(raw.headingBlock),
    headingAlignment: toHeadingAlignment(raw.contentAlignment),
    hero: toHeroSlot(raw.hero),
    modules: (raw.modules ?? []).map(toModule),
    seo: resolveSeo(raw.seo),
    translations: toPageTranslations(raw.translations),
    sectionNavigation: toSectionNavigation(raw),
    adjacentPages: toAdjacentPages(raw),
  };
}
