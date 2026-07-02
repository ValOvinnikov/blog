import type { BlockText, PortableText } from '@blog/types';

/** Resolved image with a fully-built URL */
export type TImage = {
  url: string;
  alt: string;
};

/** Author card used inside post cards */
export type TPostCardAuthor = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
};

/** Category reference used inside post cards */
export type TPostCardCategory = {
  id: string;
  title: string;
  slug: string;
};

/** A post as it appears in lists / cards */
export type TPostCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  publishedAt: string | null;
  mainImageUrl: string | null;
  mainImageAlt: string;
  featured: boolean;
  author: TPostCardAuthor | null;
  categories: TPostCardCategory[];
};

/** Site navigation item */
export type TNavItem = {
  label: string;
  href: string;
};

/** Social link item */
export type TSocialLink = {
  platform: string;
  url: string;
};

/** A full category (for detail / list pages) */
export type TCategory = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
};

/** Author detail (for the author page) */
export type TAuthorDetail = {
  id: string;
  name: string;
  slug: string;
  role: string | null;
  imageUrl: string | null;
  bio: BlockText | null;
  socialLinks: TSocialLink[];
};

/** SEO metadata */
export type TSeoMeta = {
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
};

/** Full post detail (for the post page) */
export type TPostDetail = TPostCard & {
  body: PortableText | null;
  seo: TSeoMeta | null;
  author: TPostDetailAuthor | null;
  categories: TCategory[];
};

/** Author as it appears on the full post detail */
export type TPostDetailAuthor = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  role: string | null;
  bio: BlockText | null;
  socialLinks: TSocialLink[];
};
