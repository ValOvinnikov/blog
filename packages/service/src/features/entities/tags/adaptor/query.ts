import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { tagFragment } from '@blog/service/shared/fragments/tag';

export const tagsQuery = q.star
  .filterByType('blog_tag')
  .order('title asc')
  .project((sub) => ({
    ...tagFragment,
    description: sub.field('description').nullable(true),
    // `references(^._id)` matches regardless of whether the referencing field
    // is a single reference or (as `blog_post.tags` is) an array of them.
    postCount: sub
      .count(
        sub.star
          .filterByType('blog_post')
          .filterRaw('references(^._id)')
          .filterRaw(PUBLISHED_POST_FILTER),
      )
      .notNull(true),
  }));
