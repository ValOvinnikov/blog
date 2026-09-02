import type { TImageTenant } from '@blog/service/sanity/image';
import {
  toPostCard,
  type TPostCard,
} from '@blog/service/shared/transformers/to-post-card';
import type { InferResultType } from 'groqd';

import type { postsByIdsQuery } from './query';

export type TRawPostsByIds = InferResultType<typeof postsByIdsQuery>;

export function toPostsByIds(
  raw: TRawPostsByIds,
  tenant: TImageTenant,
): TPostCard[] {
  return raw.map((rawPost) => toPostCard(rawPost, tenant));
}
