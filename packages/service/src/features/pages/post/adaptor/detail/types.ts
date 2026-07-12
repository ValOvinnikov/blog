import type { BlockText, RichText } from '@blog/config';
import type { TCategory } from '@blog/service/shared/transformers/to-category';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { TSeoMeta } from '@blog/service/shared/transformers/to-seo-meta';
import type { TSocialLink } from '@blog/service/shared/transformers/to-social-link';

export type TPostDetailAuthor = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | undefined;
  role: string | undefined;
  bio: BlockText | undefined;
  socialLinks: TSocialLink[];
};

export type TPostDetail = Omit<TPostCard, 'author' | 'categories'> & {
  body: RichText;
  seo: TSeoMeta | undefined;
  author: TPostDetailAuthor | undefined;
  categories: TCategory[];
};
