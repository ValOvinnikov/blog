import { q } from '@blog/service/sanity/query/query';

export const headingBlockFragment = q
  .fragmentForType<'headingBlock'>()
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    supportingText: sub.field('supportingText').nullable(true),
  }));
