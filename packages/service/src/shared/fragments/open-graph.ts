import { q } from '@blog/service/sanity/query';

import { imageWithAltFragment } from './image';

export const openGraphFragment = q
  .fragmentForType<'openGraph'>()
  .project((sub) => ({
    ogTitle: sub.field('ogTitle'),
    ogDescription: sub.field('ogDescription'),
    ogImage: sub.field('ogImage').project(imageWithAltFragment),
  }));
