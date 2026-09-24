import { ALERT_TYPE, type TFormStatus } from '@blog/config';
import { Alert } from '@blog/ui/components/atoms/alert';
import { Button } from '@blog/ui/components/atoms/button';
import { Spinner } from '@blog/ui/components/atoms/spinner';
import { TextInput } from '@blog/ui/components/atoms/text-input';
import {
  newsletterSignupVariants,
  type TNewsletterSignupVariants,
} from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';
import { type ReactNode, type SubmitEvent } from 'react';

type TNewsletterSignupContentProps = {
  email: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  status: TFormStatus;
  errorMessage?: string;
  errorMessageId?: string;
  submitLabel: string;
  emailAriaLabel: string;
  placeholder?: string;
  inputPrompt: ReactNode;
  variant: TNewsletterSignupVariants['variant'];
};

/** The email input, submit button, and inline error feedback shared by every density of the signup form. */
export const NewsletterSignupContent = ({
  email,
  onChange,
  onSubmit,
  status,
  errorMessage,
  errorMessageId,
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
        aria-describedby={isError && errorMessage ? errorMessageId : undefined}
        className={s.field()}
      />
      <Button
        variant="primary"
        type="submit"
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
        <Alert
          type={ALERT_TYPE.ERROR}
          message={errorMessage}
          id={errorMessageId}
        />
      )}
    </form>
  );
};
