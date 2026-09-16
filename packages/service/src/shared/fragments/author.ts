import { q } from '@blog/service/sanity/query';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link-document';
import { portableTextMarkDefFragment } from '@blog/service/shared/fragments/portable-text-mark-def';

import { sanityImageFragment } from './image';
import { socialProfileFragment } from './social-profile';

export const authorCardFragment = q
  .fragmentForType<'blog_author'>()
  .project((sub) => ({
    _id: true,
    name: sub.field('name').notNull(),
    image: sub.field('image').project(sanityImageFragment).nullable(true),
    profilePage: sub
      .field('profilePage')
      .deref()
      .project(linkDocumentFragment)
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
      .project(linkDocumentFragment)
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
      .project(socialProfileFragment)
      .nullable(true),
  }));
