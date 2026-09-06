import { q } from '@blog/service/sanity/query';

import { authorCardFragment, authorDetailFragment } from './author';
import { imageWithAltFragment, sanityImageFragment } from './image';
import { portableTextBodyItemFragment } from './portable-text-body';
import { seoFragment } from './seo';
import { tagFragment } from './tag';
import { topicFragment } from './topic';
import { WORD_COUNT_EXPRESSION, wordCountParser } from './word-count';

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
    topic: sub.field('topic').deref().project(topicFragment).notNull(),
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
    newsletterEnabled: sub.field('newsletterEnabled').nullable(true),
    body: sub.field('body[]').project(portableTextBodyItemFragment).notNull(),
    skim: sub.field('skim').project(skimFragment).nullable(true),
    seo: sub.field('seo').project(seoFragment).nullable(true),
    author: sub.field('author').deref().project(authorDetailFragment).notNull(),
    topic: sub.field('topic').deref().project(topicFragment).notNull(),
    tags: sub.field('tags[]').deref().project(tagFragment).nullable(true),
    wordCount: sub.raw(WORD_COUNT_EXPRESSION, wordCountParser),
  }));
