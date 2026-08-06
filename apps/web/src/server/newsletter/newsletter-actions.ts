'use server';

import { queries } from '@blog/db';
import { sendEmail } from '@web/server/email/send-email';
import { buildNewsletterConfirmationEmail } from '@web/server/newsletter/newsletter-confirmation-email';
import { resolveNewsletterFromAddress } from '@web/server/newsletter/newsletter-from-address';
import { markNewsletterSubscribed } from '@web/server/newsletter/newsletter-subscribed-cookie';
import { env } from '@web/utils/env/env';
import { isValidEmail } from '@web/utils/is-valid-email';
import { sanitizeLogMessage } from '@web/utils/sanitize-log-message';

export type TSubscribeResult =
  | { outcome: 'success' }
  | { outcome: 'already-subscribed' }
  | { outcome: 'invalid' }
  | { outcome: 'server-error' };

// Verified sending domain once configured in Resend
// (`NEWSLETTER_FROM_ADDRESS`, e.g. `Newsletter <news@{domain}>`), falling
// back to Resend's own shared testing sender otherwise — same pattern as
// `auth.ts`'s `MAGIC_LINK_FROM_ADDRESS`.
const NEWSLETTER_FROM_ADDRESS = resolveNewsletterFromAddress(
  env.NEWSLETTER_FROM_ADDRESS,
);

/**
 * subscribeToNewsletterAction — `NewsletterForm`'s submit action (#1044/#1104,
 * design doc Feature 5, double opt-in per D9). Re-validates the email format
 * server-side (never trusts `NewsletterForm`'s client-only check), then hands
 * off to `queries.subscribers.createPendingSubscriber`:
 *
 * - `'created'` / `'already-pending'` → sends (or re-sends) the confirmation
 *   email via the shared `sendEmail` helper, embedding the row's
 *   `confirmationToken` in `/api/newsletter/confirm?token=…`. The token is
 *   never rotated on a re-submission (see that query's own docs), so this is
 *   always the same link the reader's first confirmation email already sent.
 * - `'already-active'` → the design doc's "already subscribed" inline error,
 *   no email sent.
 *
 * Both `'success'` and `'already-subscribed'` also set
 * `NEWSLETTER_SUBSCRIBED_COOKIE` (`markNewsletterSubscribed`) — a signed-out
 * reader has no session to key "already subscribed" off, so this cookie is
 * the one durable signal `NewsletterForm`'s render call-sites use to stop
 * showing the form to someone who's already on the list. `'invalid'`/
 * `'server-error'` never set it (nothing was confirmed).
 *
 * A thrown error (a `sendEmail`/db failure) is caught and logged rather than
 * left to reject the server action — `NewsletterForm` only branches on the
 * returned `outcome`, mirroring `deleteAccountAction`/`setBookmarkStatus`'s
 * resolve-never-throw shape.
 */
export async function subscribeToNewsletterAction(
  email: string,
): Promise<TSubscribeResult> {
  if (!isValidEmail(email)) {
    return { outcome: 'invalid' };
  }

  try {
    const result = await queries.subscribers.createPendingSubscriber(email);

    if (result.outcome === 'already-active') {
      await markNewsletterSubscribed();
      return { outcome: 'already-subscribed' };
    }

    const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
    const confirmationUrl = `${siteUrl}/api/newsletter/confirm?token=${result.subscriber.confirmationToken}`;
    const { subject, html } = buildNewsletterConfirmationEmail({
      confirmationUrl,
    });

    await sendEmail({
      to: result.subscriber.email,
      from: NEWSLETTER_FROM_ADDRESS,
      subject,
      html,
    });

    await markNewsletterSubscribed();
    return { outcome: 'success' };
  } catch (error) {
    console.error(
      'Failed to subscribe to newsletter:',
      sanitizeLogMessage(error),
    );
    return { outcome: 'server-error' };
  }
}
