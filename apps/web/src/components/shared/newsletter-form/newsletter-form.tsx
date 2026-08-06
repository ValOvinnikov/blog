'use client';

import type { TFormStatus } from '@blog/config';
import { NewsletterSignup } from '@blog/ui/organisms';
import { subscribeToNewsletterAction } from '@web/server/newsletter/newsletter-actions';
import { hasNewsletterSubscribedCookie } from '@web/utils/has-newsletter-subscribed-cookie';
import { isValidEmail } from '@web/utils/is-valid-email';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

type TNewsletterFormProps = {
  /** `full` (Blog index page-builder module) vs `compact` (post page foot) — see `NewsletterSignup`'s two densities. */
  variant: 'full' | 'compact';
  heading: string;
  /** Ignored for `variant="compact"` — that density has no room for a description. */
  description?: string;
  className?: string;
};

/**
 * NewsletterForm — the double opt-in newsletter signup island (#1044,
 * placement redone by #1197/#1200), composed into the Blog index page's
 * `module_newsletter` page-builder module and every post page's foot.
 * `heading`/`description` are always CMS-sourced by the caller (the module's
 * own fields, or `settings_newsletter`) — this component never falls back to
 * i18n copy for them. Wraps `NewsletterSignup.Full`/`.Compact` (pure,
 * controlled), owning:
 *
 * - Local `email`/`status` state, following the same "plain async handler,
 *   no `useTransition`" shape as `AuthMenu`'s `useEmailSignIn`.
 * - Client-side email-format validation before submitting — an invalid
 *   address never round-trips to the server, straight to `status: 'error'`.
 * - The `subscribeToNewsletterAction` server-action call, mapping its
 *   `outcome` (`'success'` / `'already-subscribed'` / `'server-error'`; a
 *   client-caught `'invalid'` never reaches the server) onto
 *   `status`/`errorMessage`.
 * - Hiding itself for a reader who's already subscribed: subscription isn't
 *   tied to a session (a signed-out reader can subscribe), so there's no
 *   account-based way to know this — `subscribeToNewsletterAction` sets a
 *   long-lived cookie instead. This is the **single** component both the
 *   `full` and `compact` render call-sites go through — #1200's critical
 *   requirement is that the gate lives here once, not duplicated per variant
 *   — so nothing rendering `NewsletterForm` can bypass it. Both call sites
 *   are statically rendered with ISR (SPEC.md §2.5), so reading the cookie
 *   via `next/headers`'s `cookies()` in either's Server Component render
 *   path would opt that route out of static rendering entirely. Instead this
 *   mirrors `ThemeToggleButton`/`AuthMenu`'s own mounted-gate shape: render
 *   nothing until a mount effect resolves the cookie client-side, then
 *   render nothing (subscribed) or the real form (not subscribed) — the
 *   server-rendered HTML and the first client render both have nothing, so
 *   there's no hydration mismatch and no show-then-hide flash.
 */
export function NewsletterForm({
  variant,
  heading,
  description,
  className,
}: TNewsletterFormProps) {
  const t = useTranslations('newsletterForm');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<TFormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );
  const [mounted, setMounted] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Reads DOM state (`document.cookie`) set by a prior visit's successful
    // subscribe — no external-store subscription to move this into (same
    // pattern as ThemeToggleButton's `document.documentElement` read).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSubscribed(hasNewsletterSubscribedCookie(document.cookie));
    setMounted(true);
  }, []);

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setStatus('error');
      setErrorMessage(t('errorInvalid'));
      return;
    }

    setStatus('submitting');
    setErrorMessage(undefined);

    const result = await subscribeToNewsletterAction(email);

    if (result.outcome === 'success') {
      setStatus('success');
      return;
    }

    setStatus('error');
    setErrorMessage(
      result.outcome === 'already-subscribed'
        ? t('errorAlreadySubscribed')
        : t('errorServer'),
    );
  };

  if (!mounted || isSubscribed) return null;

  const sharedProps = {
    email,
    onChange: setEmail,
    onSubmit: handleSubmit,
    status,
    heading,
    errorMessage,
    successMessage: t('successMessage'),
    submitLabel: t('submitLabel'),
    emailAriaLabel: t('emailAriaLabel'),
    placeholder: t('placeholder'),
    className,
  };

  if (variant === 'compact') {
    return <NewsletterSignup.Compact {...sharedProps} />;
  }

  return <NewsletterSignup.Full {...sharedProps} description={description} />;
}
