import type {
  Page_legalIndex,
  Page_privacyIndex,
  THeadingAlignment,
  THeadingBlock,
  TMaybeUndefined,
  TPageLandingType,
} from '@shinefold/config';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TModule } from '@shinefold/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@shinefold/service/shared/transformers/seo/resolve-seo';

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
