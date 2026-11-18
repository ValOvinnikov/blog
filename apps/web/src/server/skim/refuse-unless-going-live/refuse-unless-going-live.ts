import { HTTP_STATUS, type TMaybeUndefined } from '@shinefold/config';
import { service, type TTenantSanityContext } from '@shinefold/service';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import { MS_PER_SECOND, RETRY_AFTER_HEADER } from '@web/constants/http';
import type { TGoLiveRequest } from '@web/server/skim/go-live-request/go-live-request';
import { respondEmpty } from '@web/utils/empty-response/empty-response';
import { logger } from '@web/utils/logger/logger';
import type { NextResponse } from 'next/server';

export const refuseUnlessGoingLive = async (
  { tenantId, postId, publishedAt }: TGoLiveRequest,
  readTenant: TTenantSanityContext,
): Promise<TMaybeUndefined<NextResponse>> => {
  const result = await service.entities.posts.v1.getPostPublishedAt(
    postId,
    readTenant,
  );
  if (!result.ok) {
    logger.error(GENERATE_SKIM_LOG.PUBLISHED_AT_LOOKUP_FAILED, {
      tenantId,
      postId,
      error: result.error,
    });
    return respondEmpty(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  const { data: currentPublishedAt } = result;
  const goLiveMs = Date.parse(publishedAt);
  if (!currentPublishedAt || Date.parse(currentPublishedAt) !== goLiveMs) {
    return respondEmpty(HTTP_STATUS.NO_CONTENT);
  }
  const msUntilGoLive = goLiveMs - Date.now();
  // A non-2xx makes the worker retry, so a run that wakes just before the date still generates.
  if (msUntilGoLive > 0) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(msUntilGoLive / MS_PER_SECOND),
    );
    return respondEmpty(HTTP_STATUS.TOO_EARLY, {
      [RETRY_AFTER_HEADER]: String(retryAfterSeconds),
    });
  }
  return undefined;
};
