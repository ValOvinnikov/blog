import { q } from '@blog/service/sanity/query';
import { localizedImageWithAltFragment } from '@blog/service/shared/fragments/image/localized-image-with-alt';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document';
import { socialProfileFragment } from '@blog/service/shared/fragments/social-profile/social-profile';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import { getLocalizedPortableTextBlock } from '@blog/service/shared/localization/get-localized-portable-text-block/get-localized-portable-text-block';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params/locale-params';

const localeQ = q.parameters<TLocaleParams>();

export const personCardFragment = localeQ
  .fragmentForType<'person'>()
  .project((sub) => ({
    _id: true,
    name: sub.field('name').notNull(),
    image: sub
      .field('image')
      .project(localizedImageWithAltFragment)
      .nullable(true),
    profilePage: sub
      .field('profilePage')
      .deref()
      .project(linkDocumentFragment)
      .nullable(true),
  }));

export const personDetailFragment = localeQ
  .fragmentForType<'person'>()
  .project((sub) => ({
    ...personCardFragment,
    role: getLocalizedField(sub, 'role'),
    bio: getLocalizedPortableTextBlock(sub, 'bio'),
    socialLinks: sub
      .field('socialLinks[]')
      .project(socialProfileFragment)
      .nullable(true),
  }));
