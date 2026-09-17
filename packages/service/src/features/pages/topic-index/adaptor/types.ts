import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTopicIndexType,
} from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type TTopicIndexPage = {
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageTopicIndexType>>;
  modules: TModule<TPageTopicIndexType>[];
  seo: TSeoResolved;
};
