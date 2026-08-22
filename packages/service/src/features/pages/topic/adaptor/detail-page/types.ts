import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';
import type { TTopic } from '@blog/service/shared/transformers/to-topic';

export type TTopicDetailPage = {
  topic: TTopic;
  modules: TModule[];
  seo: TSeoResolved;
  postListId: string;
};
