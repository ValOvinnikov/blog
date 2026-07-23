import { q } from '@blog/service/sanity/query';

export const tagFragment = q.fragmentForType<'blog_tag'>().project((sub) => ({
  _id: true,
  title: sub.field('title').notNull(),
  slug: sub.field('slug.current').notNull(),
}));
