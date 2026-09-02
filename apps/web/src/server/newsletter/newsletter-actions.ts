'use server';

import { queries } from '@blog/db';
import { sendEmail } from '@web/server/email/send-email';
import { buildNewsletterConfirmationEmail } from '@web/server/newsletter/newsletter-confirmation-email';
import { resolveNewsletterFromAddress } from '@web/server/newsletter/newsletter-from-address';
import { markNewsletterSubscribed } from '@web/server/newsletter/newsletter-subscribed-cookie';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { env } from '@web/utils/env/env';
import { isValidEmail } from '@web/utils/is-valid-email';
import { logger } from '@web/utils/logger/logger';

export type TSubscribeResult =
  | { outcome: 'success' }
  | { outcome: 'already-subscribed' }
  | { outcome: 'invalid' }
  | { outcome: 'server-error' };

/**
 * `NewsletterForm`'s submit action. Re-validates the email format
 * server-side, then hands off to
 * `queries.subscribers.createPendingSubscriber`: a `'created'`/
 * `'already-pending'` outcome (re-)sends the confirmation email, while
 * `'already-active'` returns the inline error without emailing. Both
 * `'success'` and `'already-subscribed'` also set
 * `NEWSLETTER_SUBSCRIBED_COOKIE` — a signed-out reader has no session to key
 * "already subscribed" off, so the cookie is the durable signal
 * `NewsletterForm`'s render call-sites use to stop showing the form.
 *
 * A thrown error is caught and logged rather than left to reject the server
 * action — `NewsletterForm` only branches on the returned `outcome`.
 */
export const subscribeToNewsletterAction = async (
  email: string,
): Promise<TSubscribeResult> => {
  if (!isValidEmail(email)) {
    return { outcome: 'invalid' };
  }

  const tenantId = await getRequestTenantId();
  if (!tenantId) {
    return { outcome: 'server-error' };
  }

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
    const confirmationUrl = `${siteUrl}/api/newsletter/confirm?token=${subscriber.confirmationToken}`;
    const { subject, html } = buildNewsletterConfirmationEmail({
      confirmationUrl,
    });

    // Resolved inside the action, not at module scope — the `'use client'`
    // `NewsletterForm` imports this module, so an eager read of
    // `env.NEWSLETTER_FROM_ADDRESS` (server-only) would throw under Vitest's
    // jsdom environment; reading it lazily here keeps importing this module
    // safe from a client boundary.
    const fromAddress = resolveNewsletterFromAddress(
      env.NEWSLETTER_FROM_ADDRESS,
    );

    await sendEmail({
      to: subscriber.email,
      from: fromAddress,
      subject,
      html,
    });

    await markNewsletterSubscribedSafely();
    return { outcome: 'success' };
  } catch (error) {
    logger.error('newsletter.subscribe_failed', { error });
    return { outcome: 'server-error' };
  }
};

/**
 * markNewsletterSubscribedSafely — wraps `markNewsletterSubscribed` in its
 * own try/catch, deliberately separate from the outer one above. By the
 * point either call site calls this, the actual subscription (the db write,
 * and for a brand-new/re-pending signup the confirmation email) has already
 * succeeded — a failure setting the cookie afterward shouldn't turn that
 * real success into a reported `'server-error'`, it should just mean this
 * one reader sees the form again on their next visit. Logged, never
 * rethrown.
 */
const markNewsletterSubscribedSafely = async (): Promise<void> => {
  try {
    await markNewsletterSubscribed();
  } catch (error) {
    logger.error('newsletter.subscribed_cookie_set_failed', { error });
  }
};
