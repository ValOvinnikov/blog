import type { BlockText, PortableText } from '@blog/types';

import type { TCategory } from '#/shared/transformers/to-category';
import type { TPostCard } from '#/shared/transformers/to-post-card';
import type { TSeoMeta } from '#/shared/transformers/to-seo-meta';
import type { TSocialLink } from '#/shared/transformers/to-social-link';

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
  body: PortableText;
  seo: TSeoMeta | undefined;
  author: TPostDetailAuthor | undefined;
  categories: TCategory[];
};
