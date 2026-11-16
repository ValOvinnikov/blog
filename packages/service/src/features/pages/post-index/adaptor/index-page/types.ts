import type {
  THeadingAlignment,
  THeadingBlock,
  TMaybeUndefined,
  TPagePostIndexType,
} from '@shinefold/config';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TModule } from '@shinefold/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@shinefold/service/shared/transformers/seo/resolve-seo';

export type TBlogIndexPage = {
  headingBlock: THeadingBlock;
  headingAlignment: THeadingAlignment;
  hero: TMaybeUndefined<TModule<TPagePostIndexType>>;
  modules: TModule<TPagePostIndexType>[];
  seo: TSeoResolved;
  translations: TLocaleIsoCode[];
};
