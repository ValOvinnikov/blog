import type {
  TCardStyle,
  TDensity,
  TGridColumns,
  TRadiusScale,
} from '@blog/config';
import { q } from '@blog/service/sanity/query/query';

export const moduleAppearanceFragment = q
  .fragment<{
    cardStyle?: TCardStyle;
    radiusScale?: TRadiusScale;
    density?: TDensity;
    columns?: TGridColumns;
  }>()
  .project((sub) => ({
    cardStyle: sub.field('cardStyle').nullable(true),
    radiusScale: sub.field('radiusScale').nullable(true),
    density: sub.field('density').nullable(true),
    columns: sub.field('columns').nullable(true),
  }));
