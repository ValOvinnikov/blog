import { q } from '@blog/service/sanity/query/query';

export type TAnchorPostQueryParams = {
  postId: string;
};

export const relatedPostAnchorQuery = q
  .parameters<TAnchorPostQueryParams>()
  .star.filterByType('page_post')
  .filterBy('_id == $postId')
  .slice(0)
  .project((sub) => ({
    tagIds: sub
      .field('tags[]')
      .deref()
      .project(() => ({ _id: true }))
      .nullable(true),
    topicId: sub
      .field('topic')
      .deref()
      .project(() => ({ _id: true }))
      .nullable(true),
  }))
  .nullable(true);
