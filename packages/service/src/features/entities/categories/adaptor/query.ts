import { q } from '@blog/service/sanity/query';
import { categoryFragment } from '@blog/service/shared/fragments/category';

export const categoriesQuery = q.star
  .filterByType('blog_category')
  .order('title asc')
  .project((sub) => ({
    ...categoryFragment,
    // `perspective: 'published'` (sanity/client.ts) already excludes drafts,
    // so a plain reference count is the published-post count — no extra
    // status filter needed. `^._id` (GROQ's parent-scope operator)
    // correlates each `blog_post` back to the enclosing category document
    // within this per-item projection.
    postCount: sub
      .count(sub.star.filterByType('blog_post').filterRaw('references(^._id)'))
      .notNull(true),
  }));
