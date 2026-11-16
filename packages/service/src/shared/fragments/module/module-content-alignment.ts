import type { TContentAlignment, TContentAlignmentOf } from '@shinefold/config';
import { q } from '@shinefold/service/sanity/query/query';

export const moduleContentAlignmentFragment = q
  .fragment<{ contentAlignment?: TContentAlignment }>()
  .project((sub) => ({
    contentAlignment: sub.field('contentAlignment').nullable(true),
  }));

export const moduleContentAlignmentLeftCenterFragment = q
  .fragment<{ contentAlignment?: TContentAlignmentOf<'LEFT' | 'CENTER'> }>()
  .project((sub) => ({
    contentAlignment: sub.field('contentAlignment').nullable(true),
  }));
