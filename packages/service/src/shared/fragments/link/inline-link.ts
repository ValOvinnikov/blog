import { q } from '@blog/service/sanity/query';
import {
  archivePageSlugParser,
  buildArchivePageSlugExpression,
} from '@blog/service/shared/expressions/archive-page-slug';

const TOPIC_ARCHIVE_PAGE_SLUG_EXPRESSION = buildArchivePageSlugExpression(
  'page_topic',
  'topic',
);

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
        // The blog index singleton (`page_postIndex`) has no `slug` field, so
        // it's absent from this map — `selectByType` falls through to `null`
        // for it. The three slug-having types assert `.notNull()` since their
        // schema requires the field.
        slug: ref.selectByType({
          page_post: (s) => s.field('slug.current').notNull(),
          blog_topic: (s) =>
            s.raw(TOPIC_ARCHIVE_PAGE_SLUG_EXPRESSION, archivePageSlugParser),
          page_landing: (s) => s.field('slug.current').notNull(),
        }),
      }))
      .nullable(true),
    openInNewTab: sub.field('openInNewTab').nullable(true),
    platform: sub.field('platform').nullable(true),
    accessibleLabel: sub.field('accessibleLabel').nullable(true),
  }));
