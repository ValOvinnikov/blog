import { q } from '#/sanity/query';

export const categoryFragment = q.fragmentForType<'category'>().project({
  _id: true,
  title: true,
  slug: true,
  description: true,
});
