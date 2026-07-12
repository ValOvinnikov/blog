import { q } from '#/sanity/query';

export const categoryFragment = q
  .fragmentForType<'blog_category'>()
  .project((sub) => ({
    _id: true,
    title: sub.field('title').notNull(),
    slug: sub.field('slug.current').notNull(),
    description: sub.field('description'),
  }));
