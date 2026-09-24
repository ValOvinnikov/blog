import type { TPagePostType } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import {
  WORD_COUNT_EXPRESSION,
  wordCountParser,
} from '@blog/service/shared/expressions/word-count';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { moduleFragment } from '@blog/service/shared/fragments/module/module';
import {
  personCardFragment,
  personDetailFragment,
} from '@blog/service/shared/fragments/person/person';
import { portableTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text/portable-text-body-item';
import { seoFragment } from '@blog/service/shared/fragments/seo/seo';
import { tagFragment } from '@blog/service/shared/fragments/tag/tag';
import { topicFragment } from '@blog/service/shared/fragments/topic/topic';
import type { TRawModule } from '@blog/service/shared/transformers/module/to-module';

const postTakeawaysFragment = q
  .fragmentForType<'postTakeaways'>()
  .project((sub) => ({
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
      .project(headingBlockFragment)
      .notNull(),
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
    heroImage: sub
      .field('heroImage')
      .project(sanityImageFragment)
      .nullable(true),
    featured: sub.field('featured').nullable(true),
    author: sub.field('author').deref().project(personCardFragment).notNull(),
    topic: sub.field('topic').deref().project(topicFragment).notNull(),
    wordCount: sub.raw(WORD_COUNT_EXPRESSION, wordCountParser),
  }));

export const postDetailFragment = q
  .fragmentForType<'page_post'>()
  .project((sub) => ({
    ...postCardFragment,
    author: sub.field('author').deref().project(personDetailFragment).notNull(),
    body: sub
      .field('content[]')
      .project(portableTextBodyItemFragment)
      .notNull(),
    postTakeaways: sub
      .field('postTakeaways')
      .project(postTakeawaysFragment)
      .nullable(true),
    seo: sub.field('seo').project(seoFragment).notNull(),
    tags: sub.field('tags[]').deref().project(tagFragment).nullable(true),
    modules: sub
      .field('modules[]')
      .deref()
      .project(moduleFragment)
      .as<TRawModule<TPagePostType>[]>()
      .nullable(),
  }));
