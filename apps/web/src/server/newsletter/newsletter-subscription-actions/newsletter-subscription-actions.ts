'use server';

import {
  ACTION_OUTCOME,
  SUBSCRIBER_OUTCOME,
  type TActionResult,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import { NEWSLETTER_LOG } from '@web/constants/newsletter';
import { auth } from '@web/server/auth/auth';
import { deliverNewsletterConfirmation } from '@web/server/newsletter/newsletter-confirmation-send/newsletter-confirmation-send';
import { clearNewsletterSubscribedCookieSafely } from '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie';
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
    logger.error(NEWSLETTER_LOG.UNSUBSCRIBE_TENANT_UNRESOLVED);
    return SERVER_ERROR;
  }
  const { id: tenantId } = tenant;

  try {
    await queries.subscribers.unsubscribe(tenantId, userId);
    await clearNewsletterSubscribedCookieSafely();
    return SUCCESS;
  } catch (error) {
    logger.error(NEWSLETTER_LOG.UNSUBSCRIBE_FAILED, { error });
    return SERVER_ERROR;
  }
};

export const resendConfirmationAction =
  async (): Promise<TResendConfirmationActionResult> => {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return SERVER_ERROR;

    const tenant = await resolveWritableTenant(
      'newsletter.resend_confirmation',
    );
    if (!tenant.ok) {
      if (tenant.error === TENANT_WRITE_REFUSAL.INACTIVE) {
        logger.warn(NEWSLETTER_LOG.RESEND_CONFIRMATION_TENANT_NOT_ACTIVE);
        return toOutcome(ACTION_OUTCOME.UNAVAILABLE);
      }
      return SERVER_ERROR;
    }
    const { data: tenantId } = tenant;

    try {
      const result = await queries.subscribers.resendConfirmation(
        tenantId,
        userId,
      );
      if (result.outcome === SUBSCRIBER_OUTCOME.NOT_PENDING)
        return SERVER_ERROR;

      const { subscriberId, email, confirmationToken } = result;
      await deliverNewsletterConfirmation(
        tenantId,
        { subscriberId, email },
        confirmationToken,
      );
      return SUCCESS;
    } catch (error) {
      logger.error(NEWSLETTER_LOG.CONFIRMATION_RESEND_FAILED, { error });
      return SERVER_ERROR;
    }
  };
