import { q } from '@blog/service/sanity/query/query';

export const pageHeadingBlockFragment = q
  .fragmentForType<'pageHeadingBlock'>()
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    supportingText: sub.field('supportingText').nullable(true),
  }));
