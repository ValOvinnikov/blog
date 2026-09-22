import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTopicType,
} from '@blog/config';
import type { TModule } from '@blog/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo';
import type { TTopic } from '@blog/service/shared/transformers/topic/to-topic';

export type TTopicDetailPage = {
  topic: TTopic;
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageTopicType>>;
  modules: TModule<TPageTopicType>[];
  seo: TSeoResolved;
};
