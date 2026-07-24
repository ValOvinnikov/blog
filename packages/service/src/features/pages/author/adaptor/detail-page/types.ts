import type { BlockText, TMaybeUndefined } from '@blog/config';
import type { TArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';
import type { TSocialLink } from '@blog/service/shared/transformers/to-social-link';

export type TAuthorDetail = {
  id: string;
  name: string;
  slug: string;
  role: TMaybeUndefined<string>;
  imageUrl: TMaybeUndefined<string>;
  bio: TMaybeUndefined<BlockText>;
  socialLinks: TSocialLink[];
};

export type TAuthorPage = {
  author: TAuthorDetail;
  posts: TArchivePostCard[];
  currentPage: number;
  totalPages: number;
};
