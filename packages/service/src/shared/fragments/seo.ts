import { q } from '@blog/service/sanity/query';

import { openGraphFragment } from './open-graph';

export const seoFragment = q.fragmentForType<'seo'>().project((sub) => ({
  metaTitle: sub.field('metaTitle').notNull(),
  metaDescription: sub.field('metaDescription'),
  openGraph: sub.field('openGraph').project(openGraphFragment).nullable(true),
}));
