import type { BlockText, RichText } from '@blog/config';
import type { TCategory } from '@blog/service/shared/transformers/to-category';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';
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

// Unresolved authored SEO overrides, unlike home/blog's `resolveSeo`-backed
// `TSeoResolved` — post detail's fallback ladder (content title/excerpt/
// heroImage) lands with the `/blog/{slug}` route in a follow-up (#355).
export type TPostSeo = {
  metaTitle: string | undefined;
  metaDescription: string | undefined;
  ogTitle: string | undefined;
  ogDescription: string | undefined;
  ogImageUrl: string | undefined;
};

export type TPostDetail = Omit<TPostCard, 'author' | 'categories'> & {
  body: RichText;
  seo: TPostSeo | undefined;
  author: TPostDetailAuthor | undefined;
  categories: TCategory[];
};
