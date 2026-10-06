import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageLandingType,
} from '@blog/config';
import type { TPageTranslation } from '@blog/service/shared/localization/page-translations/to-page-translations';
import type { TFaqPageQuestion } from '@blog/service/shared/transformers/faq/resolve-faqs';
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

export type TLandingPage = {
  id: string;
  path: string;
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageLandingType>>;
  modules: TModule<TPageLandingType>[];
  faqs: TFaqPageQuestion[];
  seo: TSeoResolved;
  translations: TPageTranslation[];
  sectionNavigation: TMaybeUndefined<TLandingSectionNavigation>;
};
