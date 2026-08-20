import { q } from '@blog/service/sanity/query';

export const topicFragment = q
  .fragmentForType<'blog_topic'>()
  .project((sub) => ({
    _id: true,
    title: sub.field('title').notNull(),
    slug: sub.field('slug.current').notNull(),
    description: sub.field('description').nullable(true),
  }));
