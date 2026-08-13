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

/**
 * subscribeToNewsletterAction — `NewsletterForm`'s submit action (#1044,
 * redone by #1200 for scoped placement). Re-validates the email format
 * server-side (never trusts `NewsletterForm`'s client-only check), then
 * hands off to `queries.subscribers.createPendingSubscriber`:
 *
 * - `'created'` / `'already-pending'` → sends (or re-sends) the confirmation
 *   email via the shared `sendEmail` helper, embedding the row's
 *   `confirmationToken` in `/api/newsletter/confirm?token=…`. The token is
 *   never rotated on a re-submission (see that query's own docs), so this is
 *   always the same link the reader's first confirmation email already sent.
 * - `'already-active'` → the "already subscribed" inline error, no email
 *   sent.
 *
 * Both `'success'` and `'already-subscribed'` also set
 * `NEWSLETTER_SUBSCRIBED_COOKIE` (`markNewsletterSubscribed`, via
 * `markNewsletterSubscribedSafely` below) — a signed-out reader has no
 * session to key "already subscribed" off, so this cookie is the one
 * durable signal `NewsletterForm`'s render call-sites use to stop showing
 * the form to someone who's already on the list (#1200's shared cookie-gate
 * requirement). `'invalid'`/`'server-error'` never set it (nothing was
 * confirmed).
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
      await markNewsletterSubscribedSafely();
      return { outcome: 'already-subscribed' };
    }

    const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
    const confirmationUrl = `${siteUrl}/api/newsletter/confirm?token=${result.subscriber.confirmationToken}`;
    const { subject, html } = buildNewsletterConfirmationEmail({
      confirmationUrl,
    });

    // Resolved inside the action, not at module scope like `@blog/auth`'s
    // magic-link `from` address — `auth.ts` is never reached from a Client
    // Component's render tree, but `NewsletterForm` (a `'use client'`
    // component composed into the Blog index page and every post page,
    // #1200) imports this module, so importing it eagerly touches
    // `env.NEWSLETTER_FROM_ADDRESS` (a server-only var) the moment any of
    // those pages' modules are evaluated — including under Vitest's jsdom
    // environment, where `@t3-oss/env-nextjs` throws for a server var read
    // outside a real server context. Reading it lazily here means importing
    // this module alone is always safe.
    const fromAddress = resolveNewsletterFromAddress(
      env.NEWSLETTER_FROM_ADDRESS,
    );

    await sendEmail({
      to: result.subscriber.email,
      from: fromAddress,
      subject,
      html,
    });

    await markNewsletterSubscribedSafely();
    return { outcome: 'success' };
  } catch (error) {
    console.error(
      'Failed to subscribe to newsletter:',
      sanitizeLogMessage(error),
    );
    return { outcome: 'server-error' };
  }
}

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
async function markNewsletterSubscribedSafely(): Promise<void> {
  try {
    await markNewsletterSubscribed();
  } catch (error) {
    console.error(
      'Failed to set the newsletter-subscribed cookie:',
      sanitizeLogMessage(error),
    );
  }
}
