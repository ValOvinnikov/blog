import { q } from '@blog/service/sanity/query';

import { imageWithAltFragment } from './image';
import { socialLinkFragment } from './social-link';

// `profilePage` is optional and restricted to `page_generic` in the schema
// (`to: [{ type: 'page_generic' }]`), so a single deref projection covers it
// — unlike `link.ts`'s `internalReference`, there's no polymorphic type to
// switch on. Unset reference -> `null`; the byline renders as plain text.

export const authorCardFragment = q
  .fragmentForType<'blog_author'>()
  .project((sub) => ({
    _id: true,
    name: sub.field('name').notNull(),
    image: sub.field('image').project(imageWithAltFragment).notNull(),
    profilePage: sub
      .field('profilePage')
      .deref()
      .project((ref) => ({
        slug: ref.field('slug.current').notNull(),
      }))
      .nullable(true),
  }));

export const authorDetailFragment = q
  .fragmentForType<'blog_author'>()
  .project((sub) => ({
    _id: true,
    name: sub.field('name').notNull(),
    image: sub.field('image').project(imageWithAltFragment).notNull(),
    profilePage: sub
      .field('profilePage')
      .deref()
      .project((ref) => ({
        slug: ref.field('slug.current').notNull(),
      }))
      .nullable(true),
    role: sub.field('role').nullable(true),
    bio: sub.field('bio[]').nullable(true),
    socialLinks: sub
      .field('socialLinks[]')
      .project(socialLinkFragment)
      .nullable(true),
  }));
