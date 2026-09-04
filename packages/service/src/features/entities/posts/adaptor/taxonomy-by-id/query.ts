import { q } from '@blog/service/sanity/query';

export type TPostTaxonomyByIdParams = { postId: string };

// `^` (GROQ's parent-scope operator) refers back to the outer `blog_post`
// document within each nested subquery — `^.tags[]._ref` and
// `^.topic._ref` read that post's own reference fields, so both taxonomy
// lookups resolve in the same round-trip as the post lookup itself.
export const postTaxonomyByIdQuery = q
  .parameters<TPostTaxonomyByIdParams>()
  .star.filterByType('blog_post')
  .filterBy('_id == $postId')
  .slice(0)
  .project((post) => ({
    tagSlugs: post.star
      .filterByType('page_tag')
      .filterRaw('tag._ref in ^.tags[]._ref')
      .project((sub) => ({
        slug: sub.field('slug.current').notNull(),
      })),
    topicSlug: post.star
      .filterByType('page_topic')
      .filterRaw('topic._ref == ^.topic._ref')
      .slice(0)
      .project((sub) => ({
        slug: sub.field('slug.current').notNull(),
      }))
      .nullable(true),
  }))
  // Nullable, not `.notNull()`: the id may not resolve to a `blog_post` at
  // all (deleted between publish and webhook delivery, or the wrong
  // `_type`) — the loader turns `null` into `undefined`.
  .nullable(true);
