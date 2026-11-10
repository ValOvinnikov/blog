import { ALERT_TYPE, FORM_STATUS } from '@blog/config';
import { Alert } from '@blog/ui/components/atoms/alert';
import type { TNewsletterSignupFormState } from '@blog/ui/components/organisms/newsletter-signup/components/form/newsletter-signup-form-state';
import { newsletterSignupVariants } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';

export type TNewsletterSignupStatusProps = {
  successMessage: string;
  errorMessage?: string;
  state?: TNewsletterSignupFormState;
};

/** The outcome of a `NewsletterSignup.Form`: an inline error under the field, or the success message that replaces the form. */
export const NewsletterSignupStatus = ({
  successMessage,
  errorMessage,
  state,
}: TNewsletterSignupStatusProps) => {
  if (!state) return null;

  const { status, variant, errorId } = state;
  const s = newsletterSignupVariants({ variant });

  if (status === FORM_STATUS.SUCCESS) {
    return (
      <Alert
        type={ALERT_TYPE.SUCCESS}
        message={successMessage}
        className={s.alert()}
      />
    );
  }

  if (status !== FORM_STATUS.ERROR || !errorMessage) return null;

  return (
    <Alert
      type={ALERT_TYPE.ERROR}
      message={errorMessage}
      id={errorId}
      hasIcon={false}
      className={s.errorAlert()}
    />
  );
};
