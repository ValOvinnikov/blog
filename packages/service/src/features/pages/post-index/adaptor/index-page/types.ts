import type {
  THeadingBlock,
  TMaybeUndefined,
  TPagePostIndexType,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { THeadingAlignment } from '@blog/service/shared/transformers/heading-block/to-heading-alignment';
import type { TModule } from '@blog/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo';

export type TBlogIndexPage = {
  headingBlock: THeadingBlock;
  headingAlignment: THeadingAlignment;
  hero: TMaybeUndefined<TModule<TPagePostIndexType>>;
  modules: TModule<TPagePostIndexType>[];
  seo: TSeoResolved;
  translations: TLocaleIsoCode[];
};
