import { STUDIO_NEWSLETTER_LOG } from '@platform/constants/studio-newsletter';
import { resolveStudioCaller } from '@platform/server/auth/resolve-studio-caller';
import {
  newsletterPostTestSendSchema,
  sendNewsletterPostTest,
} from '@platform/server/newsletter-post-send/send-newsletter-post-test';
import {
  isSameOriginJsonRequest,
  readJsonBody,
  studioForbiddenResponse,
  studioProjectSchema,
} from '@platform/server/newsletter-post-send/studio-route-request';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  isOutcomeSuccess,
  NEWSLETTER_TEST_SEND_REFUSAL,
  type TNewsletterTestSendRefusal,
  type TNewsletterTestSendResult,
} from '@shinefold/config';
import { NextResponse } from 'next/server';

const REFUSAL_HTTP_STATUS = {
  [NEWSLETTER_TEST_SEND_REFUSAL.INVALID_FIELDS]: HTTP_STATUS.BAD_REQUEST,
  [NEWSLETTER_TEST_SEND_REFUSAL.RATE_LIMITED]: HTTP_STATUS.TOO_MANY_REQUESTS,
  [NEWSLETTER_TEST_SEND_REFUSAL.SEND_FAILED]: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  [NEWSLETTER_TEST_SEND_REFUSAL.FORBIDDEN]: HTTP_STATUS.FORBIDDEN,
} satisfies Record<TNewsletterTestSendRefusal, number>;

const respond = (result: TNewsletterTestSendResult): NextResponse =>
  NextResponse.json(result, {
    status: isOutcomeSuccess(result)
      ? HTTP_STATUS.OK
      : REFUSAL_HTTP_STATUS[result.reason],
  });

const refused = (
  reason:
    | typeof NEWSLETTER_TEST_SEND_REFUSAL.INVALID_FIELDS
    | typeof NEWSLETTER_TEST_SEND_REFUSAL.SEND_FAILED,
): NextResponse => respond({ outcome: ACTION_OUTCOME.REFUSED, reason });

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOriginJsonRequest(request)) return studioForbiddenResponse();

  const body = await readJsonBody(request);
  const project = studioProjectSchema.safeParse(body);
  const caller = project.success
    ? await resolveStudioCaller(project.data.projectId)
    : undefined;
  if (!caller) return studioForbiddenResponse();

  const parsed = newsletterPostTestSendSchema.safeParse(body);
  if (!parsed.success) {
    return refused(NEWSLETTER_TEST_SEND_REFUSAL.INVALID_FIELDS);
  }

  try {
    return respond(await sendNewsletterPostTest(caller, parsed.data));
  } catch (error) {
    logger.error(STUDIO_NEWSLETTER_LOG.TEST_SEND_FAILED, {
      tenantId: caller.tenant.id,
      ...toLoggableError(error),
    });
    return refused(NEWSLETTER_TEST_SEND_REFUSAL.SEND_FAILED);
  }
}
