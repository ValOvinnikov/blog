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
import {
  toBreadcrumb,
  toSectionNavigation,
  type TRawSectionPage,
  type TRawSectionTreePage,
} from './section-navigation';
import type { TLandingAdjacentPages, TLandingPageDocument } from './types';

export type TRawLandingPage = NonNullable<
  InferResultType<typeof landingPageQuery>
>;

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
