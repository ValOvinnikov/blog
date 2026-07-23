import type { BlockText, RichText, TMaybeUndefined } from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TCategory } from '@blog/service/shared/transformers/to-category';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { TSocialLink } from '@blog/service/shared/transformers/to-social-link';
import type { TTag } from '@blog/service/shared/transformers/to-tag';

export type TPostDetailAuthor = {
  id: string;
  name: string;
  slug: string;
  imageUrl: TMaybeUndefined<string>;
  role: TMaybeUndefined<string>;
  bio: TMaybeUndefined<BlockText>;
  socialLinks: TSocialLink[];
};

export type TPostDetail = Omit<TPostCard, 'author' | 'categories'> & {
  body: RichText;
  seo: TSeoResolved;
  author: TMaybeUndefined<TPostDetailAuthor>;
  categories: TCategory[];
  tags: TTag[];
  relatedPosts: TPostCard[];
};
