import { q } from '@blog/service/sanity/query';
import { sharedLinkFragment } from '@blog/service/shared/fragments/link';

// Not `.notNull()` on the deref — see `linkRefFragment` in `link.ts`.
export const socialLinkRefFragment = q
  .fragmentForType<'socialLinkRef'>()
  .project((sub) => ({
    platform: sub.field('platform').notNull(),
    labelOverride: sub.field('labelOverride').nullable(true),
    link: sub.field('link').deref().project(sharedLinkFragment).nullable(true),
  }));
