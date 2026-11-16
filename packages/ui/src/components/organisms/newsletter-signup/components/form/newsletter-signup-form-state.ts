import type { TFormStatus, TNewsletterVariant } from '@shinefold/config';
import type { TButtonProps } from '@shinefold/ui/components/atoms/button';
import type { TSpinnerProps } from '@shinefold/ui/components/atoms/spinner';

/** What `NewsletterSignup.Form` hands each of its parts: its own props, plus the id of the error message while one shows. */
export type TNewsletterSignupFormState = {
  email: string;
  onChange: (value: string) => void;
  status: TFormStatus;
  variant: TNewsletterVariant;
  busyStyle?: TButtonProps['busyStyle'];
  spinnerVariant?: TSpinnerProps['variant'];
  errorId?: string;
};
