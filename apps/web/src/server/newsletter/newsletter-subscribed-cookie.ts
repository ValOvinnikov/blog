import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name';
import { cookies } from 'next/headers';

// ~1 year — long-lived so a reader who already subscribed doesn't see the
// form again on a later visit.
const NEWSLETTER_SUBSCRIBED_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * markNewsletterSubscribed — sets `NEWSLETTER_SUBSCRIBED_COOKIE_NAME`,
 * called by `subscribeToNewsletterAction` once a subscription is confirmed
 * pending (or already active). `NewsletterForm`'s render call-sites (the
 * Blog index page's page-builder module and every post page's foot) both
 * read this cookie **client-side** (`hasNewsletterSubscribedCookie`, checked
 * in a mount effect) rather than via `next/headers`'s `cookies()` in the
 * Server Component render itself — reading a Dynamic API there would opt
 * every route rendering `NewsletterForm` out of static/ISR rendering
 * (SPEC.md §2.5). That's why this is **not** `httpOnly`: client JS has to be
 * able to read it. `sameSite: 'lax'` (a plain top-level navigation cookie,
 * no cross-site form posts to protect against), `secure` only in production
 * (so it still round-trips over plain HTTP in local dev).
 */
export async function markNewsletterSubscribed(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(NEWSLETTER_SUBSCRIBED_COOKIE_NAME, '1', {
    maxAge: NEWSLETTER_SUBSCRIBED_COOKIE_MAX_AGE_SECONDS,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  });
}

/**
 * Counterpart to `markNewsletterSubscribed`. No options are passed to
 * `delete` — the setter above sets no explicit `path`/`domain` either, so
 * both default alike and this targets the exact cookie the setter created.
 */
export async function clearNewsletterSubscribedCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(NEWSLETTER_SUBSCRIBED_COOKIE_NAME);
}
