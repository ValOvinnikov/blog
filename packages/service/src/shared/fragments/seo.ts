import { q } from '#/sanity/query';

import { imageWithAltFragment } from './image';

export const seoFragment = q.fragmentForType<'seo'>().project((sub) => ({
  metaTitle: sub.field('metaTitle').notNull(),
  metaDescription: sub.field('metaDescription'),
  ogTitle: sub.field('ogTitle'),
  ogDescription: sub.field('ogDescription'),
  ogImage: sub.field('ogImage').project(imageWithAltFragment),
}));
