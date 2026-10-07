import type { TMaybeUndefined } from '@blog/config';
import { toPageTranslations } from '@blog/service/shared/localization/page-translations/to-page-translations';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/module/to-module';
import { resolveSeo } from '@blog/service/shared/transformers/seo/resolve-seo';
import type { InferResultType } from 'groqd';

import type { landingPageQuery } from './query';
import type {
  TLandingBreadcrumb,
  TLandingPageDocument,
  TLandingSectionNavigation,
  TLandingSectionPage,
} from './types';

export type TRawLandingPage = NonNullable<
  InferResultType<typeof landingPageQuery>
>;

type TRawSectionPage = Pick<
  TRawLandingPage['sectionChain'][number],
  '_id' | 'title' | 'path'
>;

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

  const currentBranchIds = new Set(
    sectionChain.slice(0, rootIndex).map(({ _id }) => _id),
  );

  return {
    root,
    pages: (sectionRoot.children ?? []).flatMap(
      (child) => toSectionPage(child, currentBranchIds.has(child._id)) ?? [],
    ),
    breadcrumbs: [...sectionChain]
      .reverse()
      .flatMap((page) => toBreadcrumb(page) ?? []),
  };
}

export function toLandingPage(raw: TRawLandingPage): TLandingPageDocument {
  return {
    id: raw._id,
    path: raw.path,
    headingBlock: toHeadingBlock(raw.headingBlock),
    hero: toHeroSlot(raw.hero),
    modules: (raw.modules ?? []).map(toModule),
    seo: resolveSeo(raw.seo),
    translations: toPageTranslations(raw.translations),
    sectionNavigation: toSectionNavigation(raw),
  };
}
