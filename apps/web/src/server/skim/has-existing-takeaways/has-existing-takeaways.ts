import { service } from '@shinefold/service';
import { okResult, type TResult } from '@shinefold/utils';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import type { TTenantSanityWriteContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

// Without tenant write credentials nothing can read the draft; the write gate refuses that tenant later.
export const hasExistingTakeaways = async (
  postId: string,
  { tenant, tenantId }: TTenantSanityWriteContext,
): Promise<TResult<boolean>> => {
  if (!tenant) return okResult(false);

  const result = await service.editorial.skim.v1.hasPostTakeaways(
    postId,
    tenant,
  );
  if (!result.ok) {
    logger.error(GENERATE_SKIM_LOG.SUMMARY_LOOKUP_FAILED, {
      tenantId,
      postId,
      error: result.error,
    });
  }
  return result;
};
