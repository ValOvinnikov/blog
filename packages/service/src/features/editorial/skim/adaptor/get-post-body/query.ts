import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';

// Keyed by `_id` (the webhook payload's document id), not slug — this is the
// read half of the publish-time skim pipeline, not a page-render query.
export const publishedPostBodyQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('blog_post')
  .filterBy('_id == $id')
  .filterRaw(PUBLISHED_POST_FILTER)
  .slice(0)
  .project((sub) => ({
    body: sub.field('body[]').notNull(),
  }))
  .notNull();
