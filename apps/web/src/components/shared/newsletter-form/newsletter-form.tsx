'use client';

import {
  ICONS,
  SIZE,
  type TContentAlignment,
  type TFormStatus,
} from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { NewsletterSignup } from '@blog/ui/organisms/newsletter-signup';
import { subscribeToNewsletterAction } from '@web/server/newsletter/newsletter-actions';
import { hasNewsletterSubscribedCookie } from '@web/utils/has-newsletter-subscribed-cookie';
import { isValidEmail } from '@web/utils/is-valid-email';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useState } from 'react';

type TNewsletterFormProps = {
  /** `full` (Blog index page-builder module) vs `compact` (post page foot) — see `NewsletterSignup`'s two densities. */
  variant: 'full' | 'compact';
  heading: string;
  /** Forwarded to the rendered heading's `id`, so an outer landmark's `aria-labelledby` can resolve to it. */
  headingId?: string;
  /** Ignored for `variant="compact"` — that density has no room for supporting copy. */
  supportingText?: string;
  /** Horizontal alignment of the pitch pane. Ignored for `variant="compact"` — Compact has no alignment control. */
  align?: TContentAlignment;
  className?: string;
};

/**
 * The double opt-in newsletter signup island, composed into the Blog
 * index page's `module_newsletter` page-builder module and every post
 * page's foot. `heading`/`supportingText` are always CMS-sourced by the
 * caller — this component never falls back to i18n copy for them.
 *
 * Subscription isn't tied to a session (a signed-out reader can subscribe),
 * so there's no account-based way to know a reader already subscribed;
 * `subscribeToNewsletterAction` sets a long-lived cookie instead, and this
 * is the single component both the `full` and `compact` render call sites
 * go through, so the gate lives here once. Both call sites are statically
 * rendered with ISR, so reading the cookie via `next/headers`'s `cookies()`
 * server-side would opt them out of static rendering — instead this renders
 * nothing until a mount effect resolves the cookie client-side, matching
 * server and first-client render so there's no hydration mismatch.
 */
export const NewsletterForm = ({
  variant,
  heading,
  headingId,
  supportingText,
  align,
  className,
}: TNewsletterFormProps) => {
  const t = useTranslations('newsletterForm');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<TFormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );
  const [mounted, setMounted] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const errorMessageId = useId();

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
    headingId,
    errorMessage,
    errorMessageId,
    successMessage: t('successMessage'),
    submitLabel: t('submitLabel'),
    emailAriaLabel: t('emailAriaLabel'),
    placeholder: t('placeholder'),
    className,
  };

  if (variant === 'compact') {
    return <NewsletterSignup.Compact {...sharedProps} />;
  }

  const trustCues = [
    {
      icon: <Icon name={ICONS.SHIELD_CHECK} size={SIZE.SM} />,
      label: t('trustCueNoSpam'),
    },
    {
      icon: <Icon name={ICONS.CLOSE} size={SIZE.SM} />,
      label: t('trustCueUnsubscribe'),
    },
  ];

  return (
    <NewsletterSignup.Full
      {...sharedProps}
      supportingText={supportingText}
      trustCues={trustCues}
      align={align}
    />
  );
};
