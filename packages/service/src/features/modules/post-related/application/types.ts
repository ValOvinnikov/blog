import type { TPostRelatedModuleDocument } from '@shinefold/service/features/modules/post-related/adaptor/module/types';
import type { TPostCard } from '@shinefold/service/shared/transformers/post/to-post-card';

export type TPostRelatedModule = Omit<TPostRelatedModuleDocument, 'limit'> & {
  posts: TPostCard[];
};
