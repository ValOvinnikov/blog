'use server';

import { CAPABILITY, TENANT_WRITE_REFUSAL } from '@blog/config';
import { queries } from '@blog/db';
import { sendNewsletterConfirmation } from '@web/server/newsletter/newsletter-confirmation-send/newsletter-confirmation-send';
import { markNewsletterSubscribed } from '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie';
import { isSubscribeAttemptRefused } from '@web/server/newsletter/subscribe-guard/subscribe-guard';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { resolveWritableTenant } from '@web/server/tenant/write-gate/write-gate';
import { isValidEmail } from '@web/utils/is-valid-email';
import { logger } from '@web/utils/logger/logger';

export type TSubscribeResult =
  | { outcome: 'success' }
  | { outcome: 'already-subscribed' }
  | { outcome: 'invalid' }
  | { outcome: 'rate-limited' }
  | { outcome: 'server-error' }
  | { outcome: 'unavailable' };

export const subscribeToNewsletterAction = async (
  email: string,
): Promise<TSubscribeResult> => {
  if (!isValidEmail(email)) {
    return { outcome: 'invalid' };
  }

  const tenant = await resolveWritableTenant('newsletter.subscribe');
  if (!tenant.ok) {
    if (tenant.reason === TENANT_WRITE_REFUSAL.INACTIVE) {
      logger.warn('newsletter.subscribe_tenant_not_active');
      return { outcome: 'unavailable' };
    }
    return { outcome: 'server-error' };
  }
  const { tenantId } = tenant;

  if (!(await isCapabilityEnabled(CAPABILITY.NEWSLETTER))) {
    logger.warn('newsletter.subscribe_capability_disabled');
    return { outcome: 'unavailable' };
  }

  try {
    if (await isSubscribeAttemptRefused(tenantId)) {
      return { outcome: 'rate-limited' };
    }

    const result = await queries.subscribers.createPendingSubscriber(
      tenantId,
      email,
    );

    if (!result.ok) {
      logger.error('newsletter.subscribe_failed', { error: result.error });
      return { outcome: 'server-error' };
    }

    const { outcome, subscriber } = result.data;

    if (outcome === 'already-active') {
      await markNewsletterSubscribedSafely();
      return { outcome: 'already-subscribed' };
    }

    await sendNewsletterConfirmation(tenantId, subscriber);

    await markNewsletterSubscribedSafely();
    return { outcome: 'success' };
  } catch (error) {
    logger.error('newsletter.subscribe_failed', { error });
    return { outcome: 'server-error' };
  }
};

const markNewsletterSubscribedSafely = async (): Promise<void> => {
  try {
    await markNewsletterSubscribed();
  } catch (error) {
    logger.error('newsletter.subscribed_cookie_set_failed', { error });
  }
};
