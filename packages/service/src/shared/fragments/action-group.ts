import { q } from '@blog/service/sanity/query';

import { linkFragment } from './link';

const ctaActionFragment = q.fragmentForType<'ctaAction'>().project((sub) => ({
  variant: sub.field('variant').notNull(),
  appearance: sub.field('appearance').nullable(true),
  link: sub.field('link').project(linkFragment).notNull(),
}));

// `actionGroup`'s own field is also named `actions` (array of `ctaAction`),
// so a caller reads the projected array as `raw.actions.actions`.
export const actionGroupFragment = q
  .fragmentForType<'actionGroup'>()
  .project((sub) => ({
    actions: sub.field('actions[]').project(ctaActionFragment).nullable(true),
  }));
