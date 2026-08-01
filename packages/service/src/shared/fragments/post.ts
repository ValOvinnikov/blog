import { q } from '@blog/service/sanity/query';

import { authorCardFragment, authorDetailFragment } from './author';
import { categoryFragment } from './category';
import { imageWithAltFragment, sanityImageFragment } from './image';
import { seoFragment } from './seo';
import { tagFragment } from './tag';
import { WORD_COUNT_EXPRESSION, wordCountParser } from './word-count';

// `skim` carries no `.required()` validation in the schema — the whole
// object, and every field inside it, is optional (see `apps/cms/src/schema-types/objects/skim.ts`).
const skimFragment = q.fragmentForType<'skim'>().project((sub) => ({
  takeaways: sub.field('takeaways[]').nullable(true),
  generatedAt: sub.field('generatedAt').nullable(true),
  model: sub.field('model').nullable(true),
}));

export const postCardFragment = q
  .fragmentForType<'blog_post'>()
  .project((sub) => ({
    _id: true,
    title: sub.field('title').notNull(),
    slug: sub.field('slug.current').notNull(),
    excerpt: sub.field('excerpt').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
    heroImage: sub
      .field('heroImage')
      .project(imageWithAltFragment)
      .nullable(true),
    heroImageAsset: sub
      .field('heroImage')
      .project(sanityImageFragment)
      .nullable(true),
    featured: sub.field('featured').nullable(true),
    author: sub.field('author').deref().project(authorCardFragment).notNull(),
    category: sub.field('category').deref().project(categoryFragment).notNull(),
    wordCount: sub.raw(WORD_COUNT_EXPRESSION, wordCountParser),
  }));

export const postDetailFragment = q
  .fragmentForType<'blog_post'>()
  .project((sub) => ({
    _id: true,
    title: sub.field('title').notNull(),
    slug: sub.field('slug.current').notNull(),
    excerpt: sub.field('excerpt').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
    heroImage: sub
      .field('heroImage')
      .project(imageWithAltFragment)
      .nullable(true),
    heroImageAsset: sub
      .field('heroImage')
      .project(sanityImageFragment)
      .nullable(true),
    featured: sub.field('featured').nullable(true),
    body: sub.field('body[]').notNull(),
    skim: sub.field('skim').project(skimFragment).nullable(true),
    seo: sub.field('seo').project(seoFragment).nullable(true),
    author: sub.field('author').deref().project(authorDetailFragment).notNull(),
    category: sub.field('category').deref().project(categoryFragment).notNull(),
    tags: sub.field('tags[]').deref().project(tagFragment).nullable(true),
    wordCount: sub.raw(WORD_COUNT_EXPRESSION, wordCountParser),
  }));
