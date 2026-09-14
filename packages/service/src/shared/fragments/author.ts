import { q } from '@blog/service/sanity/query';

import { sanityImageFragment } from './image';
import { proseTextBodyItemFragment } from './portable-text-body';
import { socialLinkRefFragment } from './social-link';

// `profilePage` is optional and restricted to `page_landing` in the schema
// (`to: [{ type: 'page_landing' }]`), so a single deref projection covers it
// — unlike `link.ts`'s `internalReference`, there's no polymorphic type to
// switch on. Unset reference -> `null`; the byline renders as plain text.

export const authorCardFragment = q
  .fragmentForType<'blog_author'>()
  .project((sub) => ({
    _id: true,
    name: sub.field('name').notNull(),
    image: sub.field('image').project(sanityImageFragment).nullable(true),
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
    image: sub.field('image').project(sanityImageFragment).nullable(true),
    profilePage: sub
      .field('profilePage')
      .deref()
      .project((ref) => ({
        slug: ref.field('slug.current').notNull(),
      }))
      .nullable(true),
    role: sub.field('role').nullable(true),
    bio: sub.field('bio[]').project(proseTextBodyItemFragment).nullable(true),
    socialLinks: sub
      .field('socialLinks[]')
      .project(socialLinkRefFragment)
      .nullable(true),
  }));
