import type { TNewsletterSignupStatus } from '@blog/config';

import {
  newsletterSignupVariants,
  type TNewsletterSignupVariants,
} from './newsletter-signup-variants';

interface INewsletterSignupErrorMessageProps {
  status: TNewsletterSignupStatus;
  message?: string;
  variant: TNewsletterSignupVariants['variant'];
}

/**
 * Inline validation/server-error feedback for the signup form — renders
 * nothing outside the `error` status, so callers can mount it unconditionally
 * next to the field row.
 */
export const NewsletterSignupErrorMessage = ({
  status,
  message,
  variant,
}: INewsletterSignupErrorMessageProps) => {
  if (status !== 'error' || !message) return null;

  const s = newsletterSignupVariants({ variant });

  return (
    <p className={s.error()} role="alert">
      {message}
    </p>
  );
};
