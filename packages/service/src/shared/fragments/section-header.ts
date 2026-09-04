import { q } from '@blog/service/sanity/query';

export const sectionHeaderFragment = q
  .fragmentForType<'sectionHeader'>()
  .project((sub) => ({
    heading: sub.field('heading').nullable(true),
    supportingText: sub.field('supportingText').nullable(true),
  }));

export const requiredSectionHeaderFragment = q
  .fragmentForType<'requiredHeadingSectionHeader'>()
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    supportingText: sub.field('supportingText').nullable(true),
  }));
