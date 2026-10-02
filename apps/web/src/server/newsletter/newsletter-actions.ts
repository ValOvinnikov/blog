'use server';

import { routes, TENANT_WRITE_REFUSAL } from '@blog/config';
import { queries } from '@blog/db';
import { buildNewsletterConfirmationEmail, sendEmail } from '@blog/email';
import { markNewsletterSubscribed } from '@web/server/newsletter/newsletter-subscribed-cookie';
import { resolveNewsletterEmailSettings } from '@web/server/newsletter/resolve-newsletter-email-settings';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { resolveWritableTenant } from '@web/server/tenant/resolve-writable-tenant';
import { env } from '@web/utils/env/env';
import { isValidEmail } from '@web/utils/is-valid-email';
import { logger } from '@web/utils/logger/logger';
import { resolveTenantEmailIdentity } from '@web/utils/resolve-tenant-email-identity';

export type TSubscribeResult =
  | { outcome: 'success' }
  | { outcome: 'already-subscribed' }
  | { outcome: 'invalid' }
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

  try {
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

    const siteUrl = (await getTenantBaseUrl()) ?? '';
    const confirmationUrl = `${siteUrl}${routes.newsletterConfirm(subscriber.confirmationToken)}`;
    const unsubscribeUrl = `${siteUrl}${routes.newsletterUnsubscribe(subscriber.unsubscribeToken)}`;
    const { brand, brandName } = await resolveTenantEmailIdentity(tenantId);

    const {
      subject,
      body,
      logoImageUrl,
      footerPostalAddress,
      fromAddress,
      replyTo,
    } = await resolveNewsletterEmailSettings(
      tenantId,
      env.NEWSLETTER_FROM_ADDRESS,
    );

    const { html, headers } = buildNewsletterConfirmationEmail({
      subject,
      body,
      confirmationUrl,
      unsubscribeUrl,
      brand,
      brandName,
      logoImageUrl,
      footerPostalAddress,
    });

    await sendEmail({
      to: subscriber.email,
      from: fromAddress,
      subject,
      html,
      headers,
      replyTo,
    });

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
