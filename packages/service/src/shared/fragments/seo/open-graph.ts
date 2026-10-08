import { q } from '@blog/service/sanity/query/query';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { optionalImage } from '@blog/service/shared/fragments/image/optional-image';

export const openGraphFragment = q
  .fragmentForType<'openGraph'>()
  .project((sub) => ({
    ogTitle: sub.field('ogTitle').nullable(true),
    ogDescription: sub.field('ogDescription').nullable(true),
    ogImage: optionalImage(sub, 'ogImage', sanityImageFragment),
  }));
