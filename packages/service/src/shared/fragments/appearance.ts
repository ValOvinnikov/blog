import { q } from '@blog/service/sanity/query';

export const appearanceFragment = q
  .fragmentForType<'appearance'>()
  .project((sub) => ({
    background: sub.field('background').nullable(true),
    spacingTop: sub.field('spacingTop').nullable(true),
    spacingBottom: sub.field('spacingBottom').nullable(true),
    containerWidth: sub.field('containerWidth').nullable(true),
    align: sub.field('align').nullable(true),
    divider: sub.field('divider').nullable(true),
  }));
