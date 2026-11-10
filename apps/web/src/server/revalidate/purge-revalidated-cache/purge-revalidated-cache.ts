import { hasLength } from '@blog/utils/primitives';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import {
  resolveDerivedRevalidatePaths,
  type TResolveDerivedRevalidatePathsInput,
} from '@web/server/revalidate/resolve-derived-revalidate-paths/resolve-derived-revalidate-paths';
import { logger } from '@web/utils/logger/logger';
import { revalidatePath, revalidateTag } from 'next/cache';

export type TPurgeRevalidatedCacheInput =
  TResolveDerivedRevalidatePathsInput & { tags: string[] };

/** Resolves to whether a path purge ran. */
export const purgeRevalidatedCache = async ({
  tags,
  ...document
}: TPurgeRevalidatedCacheInput): Promise<boolean> => {
  for (const tag of tags) {
    // `{ expire: 0 }` forces immediate expiration — the next request blocks
    // and renders fresh. The profile shorthand ('max' etc.) is a *stale
    // window*: it keeps serving old content while revalidating in the
    // background, which for a publish webhook means updates never appear.
    revalidateTag(tag, { expire: 0 });
  }

  // Tag expiry alone does not invalidate prerendered route entries on
  // Vercel, so a path purge is required alongside the tag purge above.
  // `revalidatePath` only matches a fully resolved path (`/<tenantId>/EN/
  // blog/x`) — the bracketed route pattern (`'/', 'layout'`) matches every
  // tenant's request, never one tenant's alone.
  if (!hasLength(tags)) {
    return false;
  }

  const derived = await resolveDerivedRevalidatePaths(document);
  if (derived.ok) {
    for (const path of derived.data) {
      revalidatePath(path);
    }
  } else {
    const { type, id, tenantId } = document;
    logger.warn(REVALIDATE_LOG.PATH_PURGE_FALLBACK, {
      type,
      id,
      tenantId,
      reason: derived.error,
    });
    revalidatePath('/', 'layout');
  }
  return true;
};
