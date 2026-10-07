import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTopicIndexType,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { THeadingAlignment } from '@blog/service/shared/transformers/heading-block/to-heading-alignment';
import type { TModule } from '@blog/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo';

export type TTopicIndexPage = {
  headingBlock: THeadingBlock;
  headingAlignment: THeadingAlignment;
  hero: TMaybeUndefined<TModule<TPageTopicIndexType>>;
  modules: TModule<TPageTopicIndexType>[];
  seo: TSeoResolved;
  translations: TLocaleIsoCode[];
};
