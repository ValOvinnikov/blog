import type { TPostRelatedModuleDocument } from '@blog/service/features/modules/post-related/adaptor/module/types';
import type { TPostCard } from '@blog/service/shared/transformers/post/to-post-card';

export type TPostRelatedModule = Omit<TPostRelatedModuleDocument, 'limit'> & {
  posts: TPostCard[];
};
