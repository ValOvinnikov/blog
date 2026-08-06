import {
  newsletterSignupVariants,
  type TNewsletterSignupVariants,
} from './newsletter-signup-variants';

interface INewsletterSignupSuccessMessageProps {
  message?: string;
  variant: TNewsletterSignupVariants['variant'];
}

/**
 * Confirmation row shown in place of the field row once the caller reports
 * a `success` status — a terminal-style blinking cursor stands in for the
 * form's usual input focus.
 */
export const NewsletterSignupSuccessMessage = ({
  message,
  variant,
}: INewsletterSignupSuccessMessageProps) => {
  const s = newsletterSignupVariants({ variant });

  return (
    <p className={s.success()} role="status">
      <span aria-hidden="true">✓</span>
      <span>{message}</span>
      <span className={s.cursor()} aria-hidden="true" />
    </p>
  );
};
