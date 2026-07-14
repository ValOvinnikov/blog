import { q } from '@blog/service/sanity/query';

import { imageWithAltFragment } from './image';

export const openGraphFragment = q
  .fragmentForType<'openGraph'>()
  .project((sub) => ({
    ogTitle: sub.field('ogTitle').nullable(true),
    ogDescription: sub.field('ogDescription').nullable(true),
    ogImage: sub.field('ogImage').project(imageWithAltFragment).nullable(true),
  }));
