import { q } from '@blog/service/sanity/query';

import { openGraphFragment } from './open-graph';

export const seoFragment = q.fragmentForType<'seo'>().project((sub) => ({
  metaTitle: sub.field('metaTitle').nullable(true),
  metaDescription: sub.field('metaDescription').nullable(true),
  openGraph: sub.field('openGraph').project(openGraphFragment).nullable(true),
}));
