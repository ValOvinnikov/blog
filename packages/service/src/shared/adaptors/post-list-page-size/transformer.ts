import type { InferResultType } from 'groqd';

import type { postListPageSizeQuery } from './query';

export type TRawPostListPageSize = InferResultType<
  typeof postListPageSizeQuery
>[number];

export function toFirstPostListPageSize(
  moduleIds: string[],
  raw: TRawPostListPageSize[],
): number | null {
  const byId = new Map(raw.map((module) => [module._id, module.pageSize]));
  const firstId = moduleIds.find((id) => byId.has(id));

  return firstId === undefined ? null : (byId.get(firstId) ?? null);
}
