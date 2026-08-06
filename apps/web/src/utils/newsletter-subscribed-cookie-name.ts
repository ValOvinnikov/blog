/**
 * The cookie name `subscribeToNewsletterAction`
 * (`@web/server/newsletter/newsletter-subscribed-cookie`) sets, and
 * `NewsletterForm` reads client-side (`hasNewsletterSubscribedCookie`) to
 * skip rendering the form for an already-subscribed reader. A bare string
 * constant with no `next/headers`/DOM import, so the server writer and the
 * client reader share the exact same literal without either pulling in the
 * other's runtime — `next/headers` can't be imported from a `'use client'`
 * module.
 */
export const NEWSLETTER_SUBSCRIBED_COOKIE_NAME = 'newsletter_subscribed';
