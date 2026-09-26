import { q } from '@blog/service/sanity/query';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';
import { paragraphTextBlockFragment } from '@blog/service/shared/fragments/portable-text/paragraph-text-block';
import { socialProfileFragment } from '@blog/service/shared/fragments/social-profile/social-profile';

export const personCardFragment = q
  .fragmentForType<'person'>()
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

export const personDetailFragment = q
  .fragmentForType<'person'>()
  .project((sub) => ({
    ...personCardFragment,
    role: sub.field('role').nullable(true),
    bio: sub.field('bio[]').project(paragraphTextBlockFragment).nullable(true),
    socialLinks: sub
      .field('socialLinks[]')
      .project(socialProfileFragment)
      .nullable(true),
  }));
