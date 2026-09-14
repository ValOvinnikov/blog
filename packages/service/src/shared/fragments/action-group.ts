import { q } from '@blog/service/sanity/query';

import { sharedLinkFragment } from './link';

// Not `.notNull()` on the deref — see `linkRefFragment` in `link.ts`.
export const ctaActionRefFragment = q
  .fragmentForType<'ctaActionRef'>()
  .project((sub) => ({
    variant: sub.field('variant').notNull(),
    appearance: sub.field('appearance').nullable(true),
    labelOverride: sub.field('labelOverride').nullable(true),
    link: sub.field('link').deref().project(sharedLinkFragment).nullable(true),
  }));

// `actionGroup`'s own field is also named `actions` (array of `ctaActionRef`),
// so a caller reads the projected array as `raw.actions.actions`.
export const actionGroupFragment = q
  .fragmentForType<'actionGroup'>()
  .project((sub) => ({
    actions: sub
      .field('actions[]')
      .project(ctaActionRefFragment)
      .nullable(true),
  }));
