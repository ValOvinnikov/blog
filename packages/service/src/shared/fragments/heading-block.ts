import { q } from '@blog/service/sanity/query';

export const headingBlockFragment = q
  .fragmentForType<'headingBlock'>()
  .project((sub) => ({
    heading: sub.field('heading').nullable(true),
    supportingText: sub.field('supportingText').nullable(true),
  }));

export const requiredHeadingBlockFragment = q
  .fragmentForType<'requiredHeadingBlock'>()
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    supportingText: sub.field('supportingText').nullable(true),
  }));
