import type { TAppearance, TMaybeUndefined } from '@blog/config';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

export type TPostListModule = {
  title: string;
  posts: TPostCard[];
  appearance: TMaybeUndefined<TAppearance>;
};
