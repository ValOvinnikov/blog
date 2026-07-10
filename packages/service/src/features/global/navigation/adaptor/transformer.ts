import type { InferResultType } from 'groqd';

import type { navigationQuery } from './query';
import type { TNavigation } from './types';

export type TRawNavigation = NonNullable<
  InferResultType<typeof navigationQuery>
>;

export function toNavigation(raw: TRawNavigation): TNavigation {
  return {
    items: raw.items ?? [],
  };
}
