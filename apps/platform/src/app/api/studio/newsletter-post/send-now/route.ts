import { STUDIO_NEWSLETTER_LOG } from '@platform/constants/studio-newsletter';
import { resolveStudioCaller } from '@platform/server/auth/resolve-studio-caller';
import { startNewsletterPostSendNow } from '@platform/server/newsletter-post-send/start-newsletter-post-send-now';
import {
  isSameOriginJsonRequest,
  malformedStudioRequestResponse,
  newsletterPostSendNowBodySchema,
  readJsonBody,
  studioForbiddenResponse,
} from '@platform/server/newsletter-post-send/studio-route-request';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  isOutcomeSuccess,
  NEWSLETTER_SEND_NOW_REFUSAL,
  type TNewsletterSendNowRefusal,
  type TNewsletterSendNowResult,
} from '@shinefold/config';
import { NextResponse } from 'next/server';

const SEND_FAILED: TNewsletterSendNowResult = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: NEWSLETTER_SEND_NOW_REFUSAL.SEND_FAILED,
};

const REFUSAL_HTTP_STATUS = {
  [NEWSLETTER_SEND_NOW_REFUSAL.NOT_ELIGIBLE]: HTTP_STATUS.CONFLICT,
  [NEWSLETTER_SEND_NOW_REFUSAL.NEWSLETTER_OFF]: HTTP_STATUS.CONFLICT,
  [NEWSLETTER_SEND_NOW_REFUSAL.SENDING_OFF]: HTTP_STATUS.CONFLICT,
  [NEWSLETTER_SEND_NOW_REFUSAL.OVER_BAND]: HTTP_STATUS.CONFLICT,
  [NEWSLETTER_SEND_NOW_REFUSAL.OVER_MONTH]: HTTP_STATUS.CONFLICT,
  [NEWSLETTER_SEND_NOW_REFUSAL.ALREADY_SENT]: HTTP_STATUS.CONFLICT,
  [NEWSLETTER_SEND_NOW_REFUSAL.SEND_FAILED]: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  [NEWSLETTER_SEND_NOW_REFUSAL.FORBIDDEN]: HTTP_STATUS.FORBIDDEN,
} satisfies Record<TNewsletterSendNowRefusal, number>;

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginJsonRequest(request)) return studioForbiddenResponse();

  const parsed = newsletterPostSendNowBodySchema.safeParse(
    await readJsonBody(request),
  );
  if (!parsed.success) return malformedStudioRequestResponse();

  const { projectId, ...post } = parsed.data;
  const caller = await resolveStudioCaller(projectId);
  if (!caller) return studioForbiddenResponse();
  const { tenant } = caller;

  let result: TNewsletterSendNowResult;
  try {
    result = await startNewsletterPostSendNow(tenant, post);
  } catch (error) {
    logger.error(STUDIO_NEWSLETTER_LOG.SEND_NOW_FAILED, {
      tenantId: tenant.id,
      postId: post.postId,
      ...toLoggableError(error),
    });
    result = SEND_FAILED;
  }
  return NextResponse.json(result, {
    status: isOutcomeSuccess(result)
      ? HTTP_STATUS.OK
      : REFUSAL_HTTP_STATUS[result.reason],
  });
}
