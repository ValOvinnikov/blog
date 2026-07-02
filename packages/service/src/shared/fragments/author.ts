import { q } from '#/sanity/query';

import { imageWithAltFragment } from './image';
import { socialLinkFragment } from './social-link';

export const authorCardFragment = q
  .fragmentForType<'author'>()
  .project((sub) => ({
    _id: true,
    name: sub.field('name').notNull(),
    slug: sub.field('slug.current').notNull(),
    image: sub.field('image').project(imageWithAltFragment).notNull(),
    role: sub.field('role'),
  }));

export const authorDetailFragment = q
  .fragmentForType<'author'>()
  .project((sub) => ({
    _id: true,
    name: sub.field('name').notNull(),
    slug: sub.field('slug.current').notNull(),
    image: sub.field('image').project(imageWithAltFragment).notNull(),
    role: sub.field('role'),
    bio: sub.field('bio[]'),
    socialLinks: sub.field('socialLinks[]').project(socialLinkFragment),
  }));
