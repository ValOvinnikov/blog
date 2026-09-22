import { q } from '@blog/service/sanity/query';

/**
 * The minimal projection for a post referenced as a link (e.g. a taxonomy
 * term's latest posts) — far lighter than `postCardFragment`.
 */
export const postLinkFragment = q
  .fragmentForType<'page_post'>()
  .project((sub) => ({
    _id: true,
    headingBlock: sub
      .field('headingBlock')
      .project((heading) => ({
        heading: heading.field('heading').notNull(),
      }))
      .notNull(),
    slug: sub.field('slug.current').notNull(),
  }));
