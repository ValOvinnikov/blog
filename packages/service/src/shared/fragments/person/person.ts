import { q } from '@shinefold/service/sanity/query/query';
import { localizedImageWithAltOptionalFragment } from '@shinefold/service/shared/fragments/image/localized-image-with-alt';
import { linkDocumentFragment } from '@shinefold/service/shared/fragments/link/link-document';
import { socialProfileFragment } from '@shinefold/service/shared/fragments/social-profile/social-profile';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';
import { getLocalizedPortableTextBlock } from '@shinefold/service/shared/localization/get-localized-portable-text-block/get-localized-portable-text-block';
import type { TLocaleQueryParams } from '@shinefold/service/shared/localization/locale-query-params/locale-query-params';

const localeQ = q.parameters<TLocaleQueryParams>();

export const personCardFragment = localeQ
  .fragmentForType<'person'>()
  .project((sub) => ({
    _id: true,
    name: sub.field('name').notNull(),
    image: sub
      .field('image')
      .project(localizedImageWithAltOptionalFragment)
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
