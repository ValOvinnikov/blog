import type {
  THeadingAlignment,
  THeadingBlock,
  TMaybeNull,
  TMaybeUndefined,
  TPageLandingType,
} from '@shinefold/config';
import type { TPageTranslation } from '@shinefold/service/shared/localization/page-translations/to-page-translations';
import type { TModule } from '@shinefold/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@shinefold/service/shared/transformers/seo/resolve-seo';

export type TLandingSectionPage = {
  title: string;
  path: string;
  isCurrent: boolean;
};

export type TLandingSectionNavigationPage = TLandingSectionPage & {
  pages?: TLandingSectionPage[];
};

export type TLandingBreadcrumb = Omit<TLandingSectionPage, 'isCurrent'>;

export type TLandingSectionNavigation = {
  title: TMaybeNull<string>;
  root: TLandingSectionPage;
  pages: TLandingSectionNavigationPage[];
  breadcrumbs: TLandingBreadcrumb[];
  parentSection: TMaybeUndefined<TLandingBreadcrumb>;
};

export type TLandingAdjacentPages = {
  previous: TMaybeUndefined<TLandingBreadcrumb>;
  next: TMaybeUndefined<TLandingBreadcrumb>;
};

export type TLandingPageDocument = {
  id: string;
  path: string;
  headingBlock: THeadingBlock;
  headingAlignment: THeadingAlignment;
  hero: TMaybeUndefined<TModule<TPageLandingType>>;
  modules: TModule<TPageLandingType>[];
  seo: TSeoResolved;
  translations: TPageTranslation[];
  sectionNavigation: TMaybeUndefined<TLandingSectionNavigation>;
  adjacentPages: TMaybeUndefined<TLandingAdjacentPages>;
};
