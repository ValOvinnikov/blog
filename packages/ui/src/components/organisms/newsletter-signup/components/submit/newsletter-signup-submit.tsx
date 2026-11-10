import { FORM_STATUS } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import type { TNewsletterSignupFormState } from '@blog/ui/components/organisms/newsletter-signup/components/form/newsletter-signup-form-state';
import { newsletterSignupVariants } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';

export type TNewsletterSignupSubmitProps = {
  submitLabel: string;
  busyLabel: string;
  state?: TNewsletterSignupFormState;
};

/** The submit button of a `NewsletterSignup.Form`, busy while it submits. */
export const NewsletterSignupSubmit = ({
  submitLabel,
  busyLabel,
  state,
}: TNewsletterSignupSubmitProps) => {
  if (!state) return null;

  const { status, variant, busyStyle, spinnerVariant } = state;
  const s = newsletterSignupVariants({ variant });

  return (
    <Button
      variant="primary"
      type="submit"
      isBusy={status === FORM_STATUS.SUBMITTING}
      busyLabel={busyLabel}
      busyStyle={busyStyle}
      spinnerVariant={spinnerVariant}
      className={s.submit()}
    >
      {submitLabel}
    </Button>
  );
};
