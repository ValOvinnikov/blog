import { q } from '@blog/service/sanity/query/query';
import {
  PAGE_PATH_EXPRESSION,
  pagePathParser,
} from '@blog/service/shared/expressions/landing-page/landing-page-path';
import { topicArchivePageSlugFragment } from '@blog/service/shared/fragments/archive-page/archive-page-slug';

export const inlineLinkFragment = q
  .fragmentForType<'inlineLink'>()
  .project((sub) => ({
    label: sub.field('label').notNull(),
    linkType: sub.field('linkType').notNull(),
    url: sub.field('url').nullable(true),
    internalReference: sub
      .field('internalReference')
      .deref()
      .project((ref) => ({
        _type: true,
        slug: ref.selectByType(
          { blog_topic: () => topicArchivePageSlugFragment },
          ref.raw(PAGE_PATH_EXPRESSION, pagePathParser),
        ),
      }))
      .nullable(true),
    openInNewTab: sub.field('openInNewTab').nullable(true),
    platform: sub.field('platform').nullable(true),
  }));
