import type { TFormStatus } from '@blog/config';
import type { TButtonProps } from '@blog/ui/components/atoms/button';
import type { TSpinnerProps } from '@blog/ui/components/atoms/spinner';
import type { TNewsletterSignupVariants } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';

/** What `NewsletterSignup.Form` hands each of its parts: its own props, plus the id of the error message while one shows. */
export type TNewsletterSignupFormState = {
  email: string;
  onChange: (value: string) => void;
  status: TFormStatus;
  variant: TNewsletterSignupVariants['variant'];
  busyStyle?: TButtonProps['busyStyle'];
  spinnerVariant?: TSpinnerProps['variant'];
  errorId?: string;
};
