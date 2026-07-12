import { toLink } from '@blog/service/shared/transformers/to-link';
import type { InferResultType } from 'groqd';

import type { navigationQuery } from './query';
import type { TNavigation } from './types';

export type TRawNavigation = NonNullable<
  InferResultType<typeof navigationQuery>
>;

export function toNavigation(raw: TRawNavigation): TNavigation {
  return {
    items: (raw.items ?? []).flatMap((item) => toLink(item) ?? []),
  };
}
