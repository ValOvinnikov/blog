import type { TSubscribeResult } from '@web/server/newsletter/newsletter-actions';

/**
 * Storybook-only stand-in for the real `'use server'` action, which pulls
 * in `@blog/db` (a `server-only`-guarded module) — importing it into a
 * browser bundle throws immediately, so `NewsletterForm`'s story wiring
 * aliases this module in instead (`.storybook/main.ts`). Resolves
 * `success` for any address containing `fail`; every other address
 * resolves `success` after a short delay so the `submitting` state is
 * visible.
 */
export async function subscribeToNewsletterAction(
  email: string,
): Promise<TSubscribeResult> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (email.includes('fail')) {
    return { outcome: 'server-error' };
  }

  return { outcome: 'success' };
}
