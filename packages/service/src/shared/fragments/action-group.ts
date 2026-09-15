import { q } from '@blog/service/sanity/query';

import { linkFragment } from './link';

export const ctaActionFragment = q
  .fragmentForType<'ctaAction'>()
  .project((sub) => ({
    variant: sub.field('variant').notNull(),
    appearance: sub.field('appearance').nullable(true),
    link: sub.field('link').project(linkFragment).notNull(),
  }));
