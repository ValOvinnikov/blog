import { q } from '@shinefold/service/sanity/query/query';
import { sanityImageOptionalFragment } from '@shinefold/service/shared/fragments/image/image';

export const openGraphFragment = q
  .fragmentForType<'openGraph'>()
  .project((sub) => ({
    ogTitle: sub.field('ogTitle').nullable(true),
    ogDescription: sub.field('ogDescription').nullable(true),
    ogImage: sub
      .field('ogImage')
      .project(sanityImageOptionalFragment)
      .nullable(true),
  }));
