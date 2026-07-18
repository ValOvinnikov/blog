import { q } from '@blog/service/sanity/query';

import { imageWithAltFragment } from './image';
import { socialLinkFragment } from './social-link';

// `role` is intentionally omitted — no post-card consumer (`toPostCard`,
// `THeroModule`, `TPostListModule`) reads it. `authorDetailFragment` below is
// the one that carries it, for the author bio page / post detail byline.
export const authorCardFragment = q
  .fragmentForType<'blog_author'>()
  .project((sub) => ({
    _id: true,
    name: sub.field('name').notNull(),
    slug: sub.field('slug.current').notNull(),
    image: sub.field('image').project(imageWithAltFragment).notNull(),
  }));

export const authorDetailFragment = q
  .fragmentForType<'blog_author'>()
  .project((sub) => ({
    _id: true,
    name: sub.field('name').notNull(),
    slug: sub.field('slug.current').notNull(),
    image: sub.field('image').project(imageWithAltFragment).notNull(),
    role: sub.field('role').nullable(true),
    bio: sub.field('bio[]').nullable(true),
    socialLinks: sub
      .field('socialLinks[]')
      .project(socialLinkFragment)
      .nullable(true),
  }));
