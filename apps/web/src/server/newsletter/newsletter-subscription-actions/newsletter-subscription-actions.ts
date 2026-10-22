'use server';

import {
  ACTION_OUTCOME,
  SUBSCRIBER_OUTCOME,
  type TActionResult,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import { auth } from '@web/server/auth/auth';
import { deliverNewsletterConfirmation } from '@web/server/newsletter/newsletter-confirmation-send/newsletter-confirmation-send';
import { clearNewsletterSubscribedCookie } from '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { resolveWritableTenant } from '@web/server/tenant/write-gate/write-gate';
import { logger } from '@web/utils/logger/logger';

export type TUnsubscribeResult = TActionResult<
  typeof ACTION_OUTCOME.SERVER_ERROR
>;
export type TResendConfirmationActionResult = TActionResult<
  typeof ACTION_OUTCOME.UNAVAILABLE | typeof ACTION_OUTCOME.SERVER_ERROR
>;

const SUCCESS = toOutcome(ACTION_OUTCOME.SUCCESS);
const SERVER_ERROR = toOutcome(ACTION_OUTCOME.SERVER_ERROR);

export const unsubscribeAction = async (): Promise<TUnsubscribeResult> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return SERVER_ERROR;

  const tenant = await resolveRequestTenant();
  if (!tenant) {
    logger.error('newsletter.unsubscribe_tenant_unresolved');
    return SERVER_ERROR;
  }
  const { id: tenantId } = tenant;

  try {
    await queries.subscribers.unsubscribe(tenantId, userId);
    await clearNewsletterSubscribedCookieSafely();
    return SUCCESS;
  } catch (error) {
    logger.error('newsletter.unsubscribe_failed', { error });
    return SERVER_ERROR;
  }
};

const clearNewsletterSubscribedCookieSafely = async (): Promise<void> => {
  try {
    await clearNewsletterSubscribedCookie();
  } catch (error) {
    logger.error('newsletter.subscribed_cookie_clear_failed', { error });
  }
};

export const resendConfirmationAction =
  async (): Promise<TResendConfirmationActionResult> => {
    const session = await auth();
    const userId = session?.user?.id;
    const email = session?.user?.email;
    if (!userId || !email) return SERVER_ERROR;

    const tenant = await resolveWritableTenant(
      'newsletter.resend_confirmation',
    );
    if (!tenant.ok) {
      if (tenant.reason === TENANT_WRITE_REFUSAL.INACTIVE) {
        logger.warn('newsletter.resend_confirmation_tenant_not_active');
        return toOutcome(ACTION_OUTCOME.UNAVAILABLE);
      }
      return SERVER_ERROR;
    }
    const { tenantId } = tenant;

    try {
      const result = await queries.subscribers.prepareConfirmationResend(
        tenantId,
        userId,
      );
      if (result.outcome === SUBSCRIBER_OUTCOME.NOT_PENDING)
        return SERVER_ERROR;

      const { subscriberId, confirmationToken } = result;
      await deliverNewsletterConfirmation(
        tenantId,
        { subscriberId, email },
        confirmationToken,
      );
      return SUCCESS;
    } catch (error) {
      logger.error('newsletter.confirmation_resend_failed', { error });
      return SERVER_ERROR;
    }
  };
