import { ALERT_TYPE, ICONS, type TFormStatus } from '@blog/config';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Icon } from '@blog/ui/atoms/icon';
import { TextInput } from '@blog/ui/atoms/text-input';
import {
  newsletterSignupVariants,
  type TNewsletterSignupVariants,
} from '@blog/ui/organisms/newsletter-signup/newsletter-signup-variants';
import { type SubmitEvent } from 'react';

interface INewsletterSignupContentProps {
  email: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  status: TFormStatus;
  errorMessage?: string;
  submitLabel: string;
  emailAriaLabel: string;
  placeholder?: string;
  variant: TNewsletterSignupVariants['variant'];
}

/**
 * The email input, submit button, and inline error feedback shared by every
 * density of the signup form — `Full` and `Compact` differ only in the
 * `$ subscribe --email` prompt prefix the `compact` variant prepends.
 */
export const NewsletterSignupContent = ({
  email,
  onChange,
  onSubmit,
  status,
  errorMessage,
  submitLabel,
  emailAriaLabel,
  placeholder,
  variant,
}: INewsletterSignupContentProps) => {
  const isCompact = variant === 'compact';
  const isSubmitting = status === 'submitting';
  const isError = status === 'error';
  const s = newsletterSignupVariants({ variant });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className={s.form()} onSubmit={handleSubmit} noValidate>
      {isCompact && (
        <>
          <span className={s.prompt()} aria-hidden="true">
            $
          </span>
          <span className={s.label()}>subscribe --email</span>
        </>
      )}
      <TextInput
        value={email}
        onChange={onChange}
        ariaLabel={emailAriaLabel}
        prompt="›"
        placeholder={placeholder}
        type="email"
        invalid={isError}
        disabled={isSubmitting}
        className={s.field()}
      />
      <Button
        variant="primary"
        onClick={onSubmit}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className={s.submit()}
      >
        {isSubmitting && <Icon name={ICONS.SPINNER} className={s.spinner()} />}
        {submitLabel}
      </Button>
      {isError && errorMessage && (
        <Alert tone={ALERT_TYPE.ERROR}>{errorMessage}</Alert>
      )}
    </form>
  );
};
