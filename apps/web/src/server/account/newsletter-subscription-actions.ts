'use server';

import { queries } from '@blog/db';
import { auth } from '@web/server/auth/auth';
import { sendEmail } from '@web/server/email/send-email';
import { buildNewsletterConfirmationEmail } from '@web/server/newsletter/newsletter-confirmation-email';
import { resolveNewsletterFromAddress } from '@web/server/newsletter/newsletter-from-address';
import { clearNewsletterSubscribedCookie } from '@web/server/newsletter/newsletter-subscribed-cookie';
import { getSoleTenantId } from '@web/server/site-config/get-site-config';
import { env } from '@web/utils/env/env';
import { sanitizeLogMessage } from '@web/utils/sanitize-log-message';

export type TUnsubscribeResult = { ok: true } | { ok: false };
export type TResendConfirmationActionResult = { ok: true } | { ok: false };

/**
 * unsubscribeAction — the `/account` 6b "unsubscribe" control's server write
 * (#1155/#1158), called from `NewsletterSubscriptionControl`. Reads the
 * session itself rather than trusting a caller-supplied `userId` — same
 * defensive stance as `deleteAccountAction`. `queries.subscribers.unsubscribe`
 * deletes the subscriber row (idempotent no-op if none exists); a subsequent
 * `getSubscriptionStatus` call then reports `not-subscribed`, so the 6b
 * section disappears from the page on the next render.
 *
 * Also clears `NEWSLETTER_SUBSCRIBED_COOKIE` (#1413) — without this, the
 * cookie `subscribeToNewsletterAction` set at signup time keeps hiding
 * `NewsletterForm` on the Home page for a reader who just unsubscribed.
 */
export async function unsubscribeAction(): Promise<TUnsubscribeResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false };

  const tenantId = await getSoleTenantId();
  if (!tenantId) return { ok: false };

  try {
    await queries.subscribers.unsubscribe(tenantId, userId);
    await clearNewsletterSubscribedCookieSafely();
    return { ok: true };
  } catch (error) {
    console.error(
      'Failed to unsubscribe from the newsletter:',
      sanitizeLogMessage(error),
    );
    return { ok: false };
  }
}

/**
 * clearNewsletterSubscribedCookieSafely — wraps
 * `clearNewsletterSubscribedCookie` in its own try/catch, mirroring
 * `newsletter-actions.ts`'s `markNewsletterSubscribedSafely`. By the point
 * this runs, the db unsubscribe has already succeeded — a failure clearing
 * the cookie afterward shouldn't turn that real success into a reported
 * `{ ok: false }`, it should just mean this one reader doesn't see the form
 * again until the cookie expires. Logged, never rethrown.
 */
async function clearNewsletterSubscribedCookieSafely(): Promise<void> {
  try {
    await clearNewsletterSubscribedCookie();
  } catch (error) {
    console.error(
      'Failed to clear the newsletter-subscribed cookie:',
      sanitizeLogMessage(error),
    );
  }
}

/**
 * resendConfirmationAction — the `/account` 6b "resend confirmation"
 * control's server write (#1155/#1158). `queries.subscribers
 * .resendConfirmation` only validates the pending row still exists and
 * hands back its unchanged `confirmationToken` — it never sends email
 * itself (see that query's own docs) — so this action mirrors
 * `subscribeToNewsletterAction`'s exact email-sending block: build the
 * `/api/newsletter/confirm?token=…` URL, `buildNewsletterConfirmationEmail`,
 * `resolveNewsletterFromAddress`, `sendEmail`. The session's own `email` is
 * the `to` address — `resendConfirmation` doesn't return the subscriber's
 * email, and it's the same value anyway (the db function resolves the
 * subscriber by joining through `users.email`).
 */
export async function resendConfirmationAction(): Promise<TResendConfirmationActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email;
  if (!userId || !email) return { ok: false };

  const tenantId = await getSoleTenantId();
  if (!tenantId) return { ok: false };

  try {
    const result = await queries.subscribers.resendConfirmation(
      tenantId,
      userId,
    );
    if (result.outcome === 'not-pending') return { ok: false };

    const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
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
    console.error(
      'Failed to resend the newsletter confirmation email:',
      sanitizeLogMessage(error),
    );
    return { ok: false };
  }
}
