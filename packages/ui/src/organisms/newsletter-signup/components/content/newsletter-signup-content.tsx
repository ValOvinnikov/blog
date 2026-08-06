import { ALERT_TYPE, type TFormStatus } from '@blog/config';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Spinner } from '@blog/ui/atoms/spinner';
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
 * density of the signup form — `Full` and `Compact` each wrap this with
 * their own surrounding chrome.
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
  const isSubmitting = status === 'submitting';
  const isError = status === 'error';
  const s = newsletterSignupVariants({ variant });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className={s.form()} onSubmit={handleSubmit} noValidate>
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
        {isSubmitting ? (
          <Spinner
            label={submitLabel}
            className={s.spinner()}
            dataTestId="newsletter-signup-spinner"
          />
        ) : (
          submitLabel
        )}
      </Button>
      {isError && errorMessage && (
        <Alert type={ALERT_TYPE.ERROR} message={errorMessage} />
      )}
    </form>
  );
};
