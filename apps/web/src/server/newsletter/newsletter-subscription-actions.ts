'use server';

import { queries } from '@blog/db';
import { auth } from '@web/server/auth/auth';
import { sendEmail } from '@web/server/email/send-email';
import { buildNewsletterConfirmationEmail } from '@web/server/newsletter/newsletter-confirmation-email';
import { resolveNewsletterFromAddress } from '@web/server/newsletter/newsletter-from-address';
import { clearNewsletterSubscribedCookie } from '@web/server/newsletter/newsletter-subscribed-cookie';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';

export type TUnsubscribeResult = { ok: true } | { ok: false };
export type TResendConfirmationActionResult = { ok: true } | { ok: false };

/**
 * `NewsletterSubscriptionControl`'s "unsubscribe" server write. Reads the
 * session itself rather than trusting a caller-supplied `userId`.
 * `queries.subscribers.unsubscribe` deletes the subscriber row
 * (idempotent no-op if none exists).
 *
 * Also clears `NEWSLETTER_SUBSCRIBED_COOKIE` — without this, the cookie
 * `subscribeToNewsletterAction` set at signup time keeps hiding
 * `NewsletterForm` for a reader who just unsubscribed.
 */
export const unsubscribeAction = async (): Promise<TUnsubscribeResult> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false };

  const tenantId = await getRequestTenantId();
  if (!tenantId) return { ok: false };

  try {
    await queries.subscribers.unsubscribe(tenantId, userId);
    await clearNewsletterSubscribedCookieSafely();
    return { ok: true };
  } catch (error) {
    logger.error('newsletter.unsubscribe_failed', { error });
    return { ok: false };
  }
};

/**
 * clearNewsletterSubscribedCookieSafely — wraps
 * `clearNewsletterSubscribedCookie` in its own try/catch, mirroring
 * `newsletter-actions.ts`'s `markNewsletterSubscribedSafely`. By the point
 * this runs, the db unsubscribe has already succeeded — a failure clearing
 * the cookie afterward shouldn't turn that real success into a reported
 * `{ ok: false }`, it should just mean this one reader doesn't see the form
 * again until the cookie expires. Logged, never rethrown.
 */
const clearNewsletterSubscribedCookieSafely = async (): Promise<void> => {
  try {
    await clearNewsletterSubscribedCookie();
  } catch (error) {
    logger.error('newsletter.subscribed_cookie_clear_failed', { error });
  }
};

/**
 * `NewsletterSubscriptionControl`'s "resend confirmation" server write.
 * `queries.subscribers.resendConfirmation` only validates the pending row
 * still exists and hands back its unchanged `confirmationToken` — it never
 * sends email itself, so this action mirrors
 * `subscribeToNewsletterAction`'s email-sending block. The session's own
 * `email` is the `to` address since `resendConfirmation` doesn't return one.
 */
export const resendConfirmationAction =
  async (): Promise<TResendConfirmationActionResult> => {
    const session = await auth();
    const userId = session?.user?.id;
    const email = session?.user?.email;
    if (!userId || !email) return { ok: false };

    const tenantId = await getRequestTenantId();
    if (!tenantId) return { ok: false };

    try {
      const result = await queries.subscribers.resendConfirmation(
        tenantId,
        userId,
      );
      if (result.outcome === 'not-pending') return { ok: false };

      const siteUrl = (await getTenantBaseUrl()) ?? '';
      const confirmationUrl = `${siteUrl}/api/newsletter/confirm?token=${result.confirmationToken}`;
      const { subject, html } = buildNewsletterConfirmationEmail({
        confirmationUrl,
      });
      const fromAddress = resolveNewsletterFromAddress(
        env.NEWSLETTER_FROM_ADDRESS,
      );

      await sendEmail({ to: email, from: fromAddress, subject, html });
      return { ok: true };
    } catch (error) {
      logger.error('newsletter.confirmation_resend_failed', { error });
      return { ok: false };
    }
  };
