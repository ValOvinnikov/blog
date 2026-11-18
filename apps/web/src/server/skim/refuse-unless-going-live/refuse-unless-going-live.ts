import { HTTP_STATUS, type TMaybeUndefined } from '@shinefold/config';
import { service, type TTenantSanityContext } from '@shinefold/service';
import {
  GENERATE_SKIM_LOG,
  GO_LIVE_RETRY_AFTER_SECONDS,
} from '@web/constants/generate-skim';
import { RETRY_AFTER_HEADER } from '@web/constants/http';
import { respondEmpty } from '@web/utils/empty-response/empty-response';
import { logger } from '@web/utils/logger/logger';
import type { NextResponse } from 'next/server';

interface IGoLiveRequest {
  tenantId: string;
  postId: string;
  publishedAt: string;
}

export const refuseUnlessGoingLive = async (
  { tenantId, postId, publishedAt }: IGoLiveRequest,
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
  // A non-2xx makes the worker retry, so a run that wakes just before the date still generates.
  if (goLiveMs > Date.now()) {
    return respondEmpty(HTTP_STATUS.TOO_EARLY, {
      [RETRY_AFTER_HEADER]: String(GO_LIVE_RETRY_AFTER_SECONDS),
    });
  }
  return undefined;
};
