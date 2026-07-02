import { q } from '#/sanity/query';

export const authorCardFragment = q.fragmentForType<'author'>().project({
  _id: true,
  name: true,
  slug: true,
  image: true,
  role: true,
});
