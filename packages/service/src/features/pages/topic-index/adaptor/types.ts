import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTopicIndexType,
} from '@blog/config';
import type { TModule } from '@blog/service/shared/transformers/module/to-module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo/resolve-seo';

export type TTopicIndexPage = {
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageTopicIndexType>>;
  modules: TModule<TPageTopicIndexType>[];
  seo: TSeoResolved;
};
