import { STUDIO_NEWSLETTER_LOG } from '@platform/constants/studio-newsletter';
import { resolveStudioCaller } from '@platform/server/auth/resolve-studio-caller';
import { readNewsletterPostSend } from '@platform/server/newsletter-post-send/read-newsletter-post-send';
import {
  malformedStudioRequestResponse,
  newsletterPostStatusQuerySchema,
  studioForbiddenResponse,
} from '@platform/server/newsletter-post-send/studio-route-request';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { toNewsletterPostSendState } from '@platform/utils/newsletter-post-send-state/newsletter-post-send-state';
import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  type TNewsletterPostSendStatusResponse,
} from '@shinefold/config';
import { NextResponse } from 'next/server';

export async function GET(request: Request): Promise<NextResponse> {
  const parsed = newsletterPostStatusQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) return malformedStudioRequestResponse();

  const { projectId, ...post } = parsed.data;
  const caller = await resolveStudioCaller(projectId);
  if (!caller) return studioForbiddenResponse();
  const { tenant } = caller;

  try {
    const { claim, bandCeiling, confirmedCount, sendingOffCause, sendNow } =
      await readNewsletterPostSend(tenant, post);
    const status: TNewsletterPostSendStatusResponse = {
      outcome: ACTION_OUTCOME.SUCCESS,
      ...toNewsletterPostSendState(claim, bandCeiling, new Date()),
      confirmedCount,
      sendingOffCause,
      sendNow,
    };
    return NextResponse.json(status);
  } catch (error) {
    logger.error(STUDIO_NEWSLETTER_LOG.STATUS_FAILED, {
      tenantId: tenant.id,
      postId: post.postId,
      ...toLoggableError(error),
    });
    return NextResponse.json(null, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}
