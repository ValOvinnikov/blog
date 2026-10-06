'use server';

import { routes, TENANT_WRITE_REFUSAL } from '@blog/config';
import { queries } from '@blog/db';
import { buildNewsletterConfirmationEmail, sendEmail } from '@blog/email';
import { auth } from '@web/server/auth/auth';
import { clearNewsletterSubscribedCookie } from '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie';
import { resolveNewsletterEmailSettings } from '@web/server/newsletter/resolve-newsletter-email-settings/resolve-newsletter-email-settings';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { resolveWritableTenant } from '@web/server/tenant/write-gate/write-gate';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { resolveTenantEmailIdentity } from '@web/utils/resolve-tenant-email-identity';

type TSubscriptionWriteResult =
  { ok: true } | { ok: false; isUnavailable: boolean };

export type TUnsubscribeResult = TSubscriptionWriteResult;
export type TResendConfirmationActionResult = TSubscriptionWriteResult;

export const unsubscribeAction = async (): Promise<TUnsubscribeResult> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, isUnavailable: false };

  const tenant = await resolveRequestTenant();
  if (!tenant) {
    logger.error('newsletter.unsubscribe_tenant_unresolved');
    return { ok: false, isUnavailable: false };
  }
  const { id: tenantId } = tenant;

  try {
    await queries.subscribers.unsubscribe(tenantId, userId);
    await clearNewsletterSubscribedCookieSafely();
    return { ok: true };
  } catch (error) {
    logger.error('newsletter.unsubscribe_failed', { error });
    return { ok: false, isUnavailable: false };
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
    if (!userId || !email) return { ok: false, isUnavailable: false };

    const tenant = await resolveWritableTenant(
      'newsletter.resend_confirmation',
    );
    if (!tenant.ok) {
      const isUnavailable = tenant.reason === TENANT_WRITE_REFUSAL.INACTIVE;
      if (isUnavailable) {
        logger.warn('newsletter.resend_confirmation_tenant_not_active');
      }
      return { ok: false, isUnavailable };
    }
    const { tenantId } = tenant;

    try {
      const result = await queries.subscribers.resendConfirmation(
        tenantId,
        userId,
      );
      if (result.outcome === 'not-pending')
        return { ok: false, isUnavailable: false };

      const siteUrl = (await getTenantBaseUrl()) ?? '';
      const confirmationUrl = `${siteUrl}${routes.newsletterConfirm(result.confirmationToken)}`;
      const unsubscribeUrl = `${siteUrl}${routes.newsletterUnsubscribe(result.unsubscribeToken)}`;
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
        to: email,
        from: fromAddress,
        subject,
        html,
        headers,
        replyTo,
      });
      return { ok: true };
    } catch (error) {
      logger.error('newsletter.confirmation_resend_failed', { error });
      return { ok: false, isUnavailable: false };
    }
  };
