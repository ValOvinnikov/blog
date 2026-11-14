import { hasLength } from '@blog/utils/primitives';
import { purgeDerivedPaths } from '@web/server/revalidate/purge-derived-paths/purge-derived-paths';
import {
  resolveDerivedRevalidatePaths,
  type TResolveDerivedRevalidatePathsInput,
} from '@web/server/revalidate/resolve-derived-revalidate-paths/resolve-derived-revalidate-paths';
import { revalidateTag } from 'next/cache';

export type TPurgeRevalidatedCacheInput =
  TResolveDerivedRevalidatePathsInput & { tags: string[] };

/** Resolves to whether a path purge ran. */
export const purgeRevalidatedCache = async ({
  tags,
  ...document
}: TPurgeRevalidatedCacheInput): Promise<boolean> => {
  for (const tag of tags) {
    // A profile such as 'max' serves stale while revalidating; 0 expires now.
    revalidateTag(tag, { expire: 0 });
  }

  if (!hasLength(tags)) {
    return false;
  }
  // Tag expiry does not invalidate prerendered routes, so paths go too.
  const { type, id, tenantId } = document;
  purgeDerivedPaths(await resolveDerivedRevalidatePaths(document), {
    type,
    id,
    tenantId,
  });
  return true;
};
