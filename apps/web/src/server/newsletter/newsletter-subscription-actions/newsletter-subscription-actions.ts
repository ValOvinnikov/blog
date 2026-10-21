'use server';

import {
  ACTION_OUTCOME,
  SUBSCRIBER_OUTCOME,
  routes,
  type TActionResult,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { queries } from '@blog/db';
import { buildNewsletterConfirmationEmail, sendEmail } from '@blog/email';
import { toOutcome } from '@blog/utils/to-outcome';
import { auth } from '@web/server/auth/auth';
import { clearNewsletterSubscribedCookie } from '@web/server/newsletter/newsletter-subscribed-cookie/newsletter-subscribed-cookie';
import { resolveNewsletterEmailSettings } from '@web/server/newsletter/resolve-newsletter-email-settings/resolve-newsletter-email-settings';
import { getSubscribedPageLocale } from '@web/server/newsletter/subscribed-page-locale/subscribed-page-locale';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { getTenantBaseUrl } from '@web/server/tenant/tenant-base-url/tenant-base-url';
import { resolveWritableTenant } from '@web/server/tenant/write-gate/write-gate';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { resolveTenantEmailIdentity } from '@web/utils/resolve-tenant-email-identity';

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
      const result = await queries.subscribers.resendConfirmation(
        tenantId,
        userId,
      );
      if (result.outcome === SUBSCRIBER_OUTCOME.NOT_PENDING)
        return SERVER_ERROR;

      const siteUrl = (await getTenantBaseUrl()) ?? '';
      const locale = await getSubscribedPageLocale();
      const confirmationUrl = `${siteUrl}${routes.newsletterConfirm(result.confirmationToken, locale)}`;
      const unsubscribeUrl = `${siteUrl}${routes.newsletterUnsubscribe(result.unsubscribeToken, locale)}`;
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
        locale,
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
      return SUCCESS;
    } catch (error) {
      logger.error('newsletter.confirmation_resend_failed', { error });
      return SERVER_ERROR;
    }
  };
