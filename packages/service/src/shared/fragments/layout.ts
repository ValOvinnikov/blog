import { q } from '@blog/service/sanity/query';

export const layoutFragment = q.fragmentForType<'layout'>().project((sub) => ({
  spacingTop: sub.field('spacingTop').nullable(true),
  spacingBottom: sub.field('spacingBottom').nullable(true),
  containerWidth: sub.field('containerWidth').nullable(true),
  dividerTop: sub.field('dividerTop').nullable(true),
  dividerBottom: sub.field('dividerBottom').nullable(true),
}));

export const heroLayoutFragment = q
  .fragmentForType<'heroLayout'>()
  .project((sub) => ({
    spacingTop: sub.field('spacingTop').nullable(true),
    spacingBottom: sub.field('spacingBottom').nullable(true),
    dividerTop: sub.field('dividerTop').nullable(true),
    dividerBottom: sub.field('dividerBottom').nullable(true),
  }));
