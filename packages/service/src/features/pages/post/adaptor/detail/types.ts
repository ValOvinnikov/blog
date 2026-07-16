import type { BlockText, RichText, TMaybeUndefined } from '@blog/config';
import type { TCategory } from '@blog/service/shared/transformers/to-category';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';
import type { TSocialLink } from '@blog/service/shared/transformers/to-social-link';

export type TPostDetailAuthor = {
  id: string;
  name: string;
  slug: string;
  imageUrl: TMaybeUndefined<string>;
  role: TMaybeUndefined<string>;
  bio: TMaybeUndefined<BlockText>;
  socialLinks: TSocialLink[];
};

// Unresolved authored SEO overrides, unlike home/blog's `resolveSeo`-backed
// `TSeoResolved` — post detail's fallback ladder (content title/excerpt/
// heroImage) lands with the `/blog/{slug}` route in a follow-up (#355).
export type TPostSeo = {
  metaTitle: TMaybeUndefined<string>;
  metaDescription: TMaybeUndefined<string>;
  ogTitle: TMaybeUndefined<string>;
  ogDescription: TMaybeUndefined<string>;
  ogImageUrl: TMaybeUndefined<string>;
};

export type TPostDetail = Omit<TPostCard, 'author' | 'categories'> & {
  body: RichText;
  seo: TMaybeUndefined<TPostSeo>;
  author: TMaybeUndefined<TPostDetailAuthor>;
  categories: TCategory[];
};
