import { ALERT_TYPE, type TFormStatus, FORM_STATUS } from '@blog/config';
import { Alert } from '@blog/ui/components/atoms/alert';
import { Button, type TButtonProps } from '@blog/ui/components/atoms/button';
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
  busyStyle?: TButtonProps['busyStyle'];
  spinnerVariant?: TButtonProps['spinnerVariant'];
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
  busyStyle,
  spinnerVariant,
}: TNewsletterSignupContentProps) => {
  const isSubmitting = status === FORM_STATUS.SUBMITTING;
  const isError = status === FORM_STATUS.ERROR;
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
        isBusy={isSubmitting}
        busyLabel={submitLabel}
        busyStyle={busyStyle}
        spinnerVariant={spinnerVariant}
        className={s.submit()}
      >
        {submitLabel}
      </Button>
      {isError && errorMessage && (
        <Alert
          type={ALERT_TYPE.ERROR}
          message={errorMessage}
          id={errorMessageId}
          hasIcon={false}
          className={s.errorAlert()}
        />
      )}
    </form>
  );
};
