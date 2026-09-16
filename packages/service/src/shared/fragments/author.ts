import { q } from '@blog/service/sanity/query';
import { portableTextMarkDefFragment } from '@blog/service/shared/fragments/portable-text-mark-def';

import { sanityImageFragment } from './image';
import { socialLinkFragment } from './social-link';

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
    bio: sub
      .field('bio[]')
      .project((blockSub) => ({
        '...': true,
        markDefs: blockSub
          .field('markDefs[]')
          .project(portableTextMarkDefFragment)
          .nullable(true),
      }))
      .nullable(true),
    socialLinks: sub
      .field('socialLinks[]')
      .project(socialLinkFragment)
      .nullable(true),
  }));
