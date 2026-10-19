'use server';

import {
  ACTION_OUTCOME,
  CAPABILITY,
  TENANT_WRITE_REFUSAL,
  type TActionResult,
} from '@blog/config';
import { queries } from '@blog/db';
import {
  FIELD_ERROR,
  type TFieldErrorReason,
} from '@web/constants/field-error';
import { NEWSLETTER_OUTCOME } from '@web/constants/newsletter';
import { sendNewsletterConfirmation } from '@web/server/newsletter/newsletter-confirmation-send/newsletter-confirmation-send';
import { markNewsletterSubscribed } from '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie';
import { isSubscribeAttemptRefused } from '@web/server/newsletter/subscribe-guard/subscribe-guard';
import { isCapabilityEnabledForTenant } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { resolveWritableTenant } from '@web/server/tenant/write-gate/write-gate';
import { isValidEmail } from '@web/utils/is-valid-email';
import { logger } from '@web/utils/logger/logger';

export type TSubscribeRefusal =
  | typeof ACTION_OUTCOME.RATE_LIMITED
  | typeof ACTION_OUTCOME.SERVER_ERROR
  | typeof ACTION_OUTCOME.UNAVAILABLE;

export type TSubscribeResult =
  | TActionResult<TSubscribeRefusal, 'email', TFieldErrorReason>
  | { outcome: typeof NEWSLETTER_OUTCOME.ALREADY_SUBSCRIBED };

const SERVER_ERROR = { outcome: ACTION_OUTCOME.SERVER_ERROR } as const;
const UNAVAILABLE = { outcome: ACTION_OUTCOME.UNAVAILABLE } as const;

export const subscribeToNewsletterAction = async (
  email: string,
): Promise<TSubscribeResult> => {
  if (!isValidEmail(email)) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { email: { reason: FIELD_ERROR.INVALID } },
    };
  }

  const tenant = await resolveWritableTenant('newsletter.subscribe');
  if (!tenant.ok) {
    if (tenant.reason === TENANT_WRITE_REFUSAL.INACTIVE) {
      logger.warn('newsletter.subscribe_tenant_not_active');
      return UNAVAILABLE;
    }
    return SERVER_ERROR;
  }
  const { tenantId } = tenant;

  if (!(await isCapabilityEnabledForTenant(tenantId, CAPABILITY.NEWSLETTER))) {
    logger.warn('newsletter.subscribe_capability_disabled');
    return UNAVAILABLE;
  }

  try {
    if (await isSubscribeAttemptRefused(tenantId)) {
      return { outcome: ACTION_OUTCOME.RATE_LIMITED };
    }

    const result = await queries.subscribers.createPendingSubscriber(
      tenantId,
      email,
    );

    if (!result.ok) {
      logger.error('newsletter.subscribe_failed', { error: result.error });
      return SERVER_ERROR;
    }

    const { outcome, subscriber } = result.data;

    if (outcome === 'already-active') {
      await markNewsletterSubscribedSafely();
      return { outcome: NEWSLETTER_OUTCOME.ALREADY_SUBSCRIBED };
    }

    await sendNewsletterConfirmation(tenantId, subscriber);

    await markNewsletterSubscribedSafely();
    return { outcome: ACTION_OUTCOME.SUCCESS };
  } catch (error) {
    logger.error('newsletter.subscribe_failed', { error });
    return SERVER_ERROR;
  }
};

const markNewsletterSubscribedSafely = async (): Promise<void> => {
  try {
    await markNewsletterSubscribed();
  } catch (error) {
    logger.error('newsletter.subscribed_cookie_set_failed', { error });
  }
};
