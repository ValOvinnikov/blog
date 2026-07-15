import { q } from '@blog/service/sanity/query';

export const linkFragment = q.fragmentForType<'link'>().project((sub) => ({
  label: sub.field('label').notNull(),
  linkType: sub.field('linkType').notNull(),
  url: sub.field('url').nullable(true),
  internalReference: sub
    .field('internalReference')
    .deref()
    .project((ref) => ({
      _type: true,
      // `page_blog` (the blog index singleton) has no `slug` field, so it's
      // absent from this map — `selectByType` falls through to `null` for
      // it. The three slug-having types assert `.notNull()` since their
      // schema requires the field.
      slug: ref.selectByType({
        blog_post: (s) => s.field('slug.current').notNull(),
        blog_category: (s) => s.field('slug.current').notNull(),
        page_generic: (s) => s.field('slug.current').notNull(),
      }),
    }))
    .nullable(true),
  openInNewTab: sub.field('openInNewTab').nullable(true),
  platform: sub.field('platform').nullable(true),
}));
