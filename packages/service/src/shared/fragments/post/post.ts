import type { TPagePostType } from '@shinefold/config';
import { q } from '@shinefold/service/sanity/query/query';
import {
  WORD_COUNT_EXPRESSION,
  wordCountParser,
} from '@shinefold/service/shared/expressions/post/word-count';
import { pageHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/page-heading-block';
import { sanityImageOptionalFragment } from '@shinefold/service/shared/fragments/image/image';
import { moduleFragment } from '@shinefold/service/shared/fragments/module/module';
import {
  personCardFragment,
  personDetailFragment,
} from '@shinefold/service/shared/fragments/person/person';
import { portableTextBodyItemFragment } from '@shinefold/service/shared/fragments/portable-text/portable-text-body-item';
import { seoFragment } from '@shinefold/service/shared/fragments/seo/seo';
import { tagFragment } from '@shinefold/service/shared/fragments/tag/tag';
import { topicFragment } from '@shinefold/service/shared/fragments/topic/topic';
import type { TRawModule } from '@shinefold/service/shared/transformers/module/to-module';

const postTakeawaysFragment = q
  .fragmentForType<'postTakeaways'>()
  .project((sub) => ({
    summary: sub.field('summary[]').nullable(true),
    generatedAt: sub.field('generatedAt').nullable(true),
    model: sub.field('model').nullable(true),
  }));

export const postCardFragment = q
  .fragmentForType<'page_post'>()
  .project((sub) => ({
    _id: true,
    headingBlock: sub
      .field('headingBlock')
      .project(pageHeadingBlockFragment)
      .notNull(),
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
    heroImage: sub
      .field('heroImage')
      .project(sanityImageOptionalFragment)
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
