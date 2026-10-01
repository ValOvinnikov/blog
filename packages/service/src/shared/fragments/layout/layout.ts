import type { HeroLayout, Layout, WideLayout } from '@blog/config';
import { q } from '@blog/service/sanity/query';

export const layoutFragment = q.fragmentForType<'layout'>().project((sub) => ({
  spacingTop: sub.field('spacingTop').nullable(true),
  spacingBottom: sub.field('spacingBottom').nullable(true),
  containerWidth: sub.field('containerWidth').nullable(true),
  dividerTop: sub.field('dividerTop').nullable(true),
  dividerBottom: sub.field('dividerBottom').nullable(true),
}));

export const wideLayoutFragment = q
  .fragmentForType<'wideLayout'>()
  .project((sub) => ({
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

export const moduleLayoutFragment = q
  .fragment<{ layout?: Layout }>()
  .project((sub) => ({
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }));

export const moduleWideLayoutFragment = q
  .fragment<{ layout?: WideLayout }>()
  .project((sub) => ({
    layout: sub.field('layout').project(wideLayoutFragment).nullable(true),
  }));

export const moduleHeroLayoutFragment = q
  .fragment<{ layout?: HeroLayout }>()
  .project((sub) => ({
    layout: sub.field('layout').project(heroLayoutFragment).nullable(true),
  }));
