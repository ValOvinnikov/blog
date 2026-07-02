import { q } from '#/sanity/query';
import { imageWithAltFragment } from '#/shared/fragments/image';

export const authorQuery = q
  .parameters<{ slug: string }>()
  .star.filterByType('author')
  .filterRaw('slug.current == $slug')
  .project((sub) => ({
    _id: true,
    name: true,
    slug: true,
    role: true,
    bio: true,
    image: sub.field('image').project(imageWithAltFragment),
    socialLinks: true,
  }))
  .slice(0);
