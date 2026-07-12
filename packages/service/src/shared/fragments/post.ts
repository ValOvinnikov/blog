import { q } from '@blog/service/sanity/query';

import { authorCardFragment, authorDetailFragment } from './author';
import { categoryFragment } from './category';
import { imageWithAltFragment, sanityImageFragment } from './image';
import { seoFragment } from './seo';

export const postCardFragment = q
  .fragmentForType<'blog_post'>()
  .project((sub) => ({
    _id: true,
    title: sub.field('title').notNull(),
    slug: sub.field('slug.current').notNull(),
    excerpt: sub.field('excerpt').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
    mainImage: sub.field('mainImage').project(imageWithAltFragment).notNull(),
    mainImageAsset: sub
      .field('mainImage')
      .project(sanityImageFragment)
      .notNull(),
    featured: sub.field('featured'),
    author: sub.field('author').deref().project(authorCardFragment).notNull(),
    categories: sub.field('categories[]').deref().project(categoryFragment),
  }));

export const postDetailFragment = q
  .fragmentForType<'blog_post'>()
  .project((sub) => ({
    _id: true,
    title: sub.field('title').notNull(),
    slug: sub.field('slug.current').notNull(),
    excerpt: sub.field('excerpt').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
    mainImage: sub.field('mainImage').project(imageWithAltFragment).notNull(),
    mainImageAsset: sub
      .field('mainImage')
      .project(sanityImageFragment)
      .notNull(),
    featured: sub.field('featured'),
    body: sub.field('body[]').notNull(),
    seo: sub.field('seo').project(seoFragment),
    author: sub.field('author').deref().project(authorDetailFragment).notNull(),
    categories: sub.field('categories[]').deref().project(categoryFragment),
  }));
