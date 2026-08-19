import { ALERT_TYPE, type TFormStatus } from '@blog/config';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Spinner } from '@blog/ui/atoms/spinner';
import { TextInput } from '@blog/ui/atoms/text-input';
import {
  newsletterSignupVariants,
  type TNewsletterSignupVariants,
} from '@blog/ui/organisms/newsletter-signup/newsletter-signup-variants';
import { type ReactNode, type SubmitEvent } from 'react';

type TNewsletterSignupContentProps = {
  email: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  status: TFormStatus;
  errorMessage?: string;
  submitLabel: string;
  emailAriaLabel: string;
  placeholder?: string;
  /** Decorative leading glyph or icon forwarded to the email `TextInput`'s `leadingIcon`. */
  inputPrompt: ReactNode;
  variant: TNewsletterSignupVariants['variant'];
};

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
  inputPrompt,
  variant,
}: TNewsletterSignupContentProps) => {
  const isSubmitting = status === 'submitting';
  const isError = status === 'error';
  const s = newsletterSignupVariants({ variant });

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className={s.form()} onSubmit={handleSubmit} noValidate={true}>
      <TextInput
        value={email}
        onChange={onChange}
        ariaLabel={emailAriaLabel}
        leadingIcon={inputPrompt}
        placeholder={placeholder}
        type="email"
        isInvalid={isError}
        isDisabled={isSubmitting}
        className={s.field()}
      />
      <Button
        variant="primary"
        onClick={onSubmit}
        isDisabled={isSubmitting}
        aria-busy={isSubmitting}
        title={isSubmitting ? submitLabel : undefined}
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
