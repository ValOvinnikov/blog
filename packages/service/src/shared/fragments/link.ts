import { q } from '@blog/service/sanity/query';

/** The destination fields of a `shared_link` document, projected wherever a reference resolves to one. */
export const sharedLinkFragment = q
  .fragmentForType<'shared_link'>()
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
          blog_topic: (s) => s.field('slug.current').notNull(),
          page_landing: (s) => s.field('slug.current').notNull(),
        }),
      }))
      .nullable(true),
    openInNewTab: sub.field('openInNewTab').nullable(true),
  }));

// Not `.notNull()` on the deref — a `shared_link` document can be deleted
// while a `linkRef` still points at it, and a dangling reference must
// resolve to `null` rather than throw and 404 the whole page.
export const linkRefFragment = q
  .fragmentForType<'linkRef'>()
  .project((sub) => ({
    labelOverride: sub.field('labelOverride').nullable(true),
    link: sub.field('link').deref().project(sharedLinkFragment).nullable(true),
  }));

export const sharedLinkAnnotationFragment = q
  .fragmentForType<'sharedLinkAnnotation'>()
  .project((sub) => ({
    link: sub.field('link').deref().project(sharedLinkFragment).nullable(true),
  }));
