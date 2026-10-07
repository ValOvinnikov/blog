import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageLandingType,
} from '@blog/config';
import type { TPageTranslation } from '@blog/service/shared/localization/page-translations/to-page-translations';
import type { THeadingAlignment } from '@blog/service/shared/transformers/heading-block/to-heading-alignment';
import type { TModule } from '@blog/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo';

export type TLandingSectionPage = {
  title: string;
  path: string;
  isCurrent: boolean;
};

export type TLandingBreadcrumb = Omit<TLandingSectionPage, 'isCurrent'>;

export type TLandingSectionNavigation = {
  root: TLandingSectionPage;
  pages: TLandingSectionPage[];
  breadcrumbs: TLandingBreadcrumb[];
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
};
