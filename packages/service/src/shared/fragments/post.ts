import { q } from '@blog/service/sanity/query';
import { requiredHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block';
import { moduleFragment } from '@blog/service/shared/fragments/module';

import { authorCardFragment, authorDetailFragment } from './author';
import { sanityImageFragment } from './image';
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
  .fragmentForType<'page_post'>()
  .project((sub) => ({
    _id: true,
    headingBlock: sub
      .field('headingBlock')
      .project(requiredHeadingBlockFragment)
      .notNull(),
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
    heroImage: sub
      .field('heroImage')
      .project(sanityImageFragment)
      .nullable(true),
    featured: sub.field('featured').nullable(true),
    author: sub.field('author').deref().project(authorCardFragment).notNull(),
    topic: sub.field('topic').deref().project(topicFragment).notNull(),
    wordCount: sub.raw(WORD_COUNT_EXPRESSION, wordCountParser),
  }));

export const postDetailFragment = q
  .fragmentForType<'page_post'>()
  .project((sub) => ({
    _id: true,
    headingBlock: sub
      .field('headingBlock')
      .project(requiredHeadingBlockFragment)
      .notNull(),
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
    heroImage: sub
      .field('heroImage')
      .project(sanityImageFragment)
      .nullable(true),
    featured: sub.field('featured').nullable(true),
    body: sub
      .field('content[]')
      .project(portableTextBodyItemFragment)
      .notNull(),
    skim: sub.field('skim').project(skimFragment).nullable(true),
    seo: sub.field('seo').project(seoFragment).nullable(true),
    author: sub.field('author').deref().project(authorDetailFragment).notNull(),
    topic: sub.field('topic').deref().project(topicFragment).notNull(),
    tags: sub.field('tags[]').deref().project(tagFragment).nullable(true),
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .nullable(true),
    wordCount: sub.raw(WORD_COUNT_EXPRESSION, wordCountParser),
  }));
