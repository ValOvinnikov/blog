import type {
  Page_legalIndex,
  Page_privacyIndex,
  THeadingBlock,
  TMaybeUndefined,
  TPageLandingType,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { THeadingAlignment } from '@blog/service/shared/transformers/heading-block/to-heading-alignment';
import type { TModule } from '@blog/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo';

export type TSectionIndexType =
  Page_privacyIndex['_type'] | Page_legalIndex['_type'];

export type TSectionIndexPageDocument = {
  id: string;
  headingBlock: THeadingBlock;
  headingAlignment: THeadingAlignment;
  hero: TMaybeUndefined<TModule<TPageLandingType>>;
  modules: TModule<TPageLandingType>[];
  seo: TSeoResolved;
  translations: TLocaleIsoCode[];
};
