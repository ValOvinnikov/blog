import { FORM_STATUS, ICONS, SIZE } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { TextInput } from '@blog/ui/components/atoms/text-input';
import type { TNewsletterSignupFormState } from '@blog/ui/components/organisms/newsletter-signup/components/form/newsletter-signup-form-state';
import { newsletterSignupVariants } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';

export type TNewsletterSignupInputProps = {
  emailAriaLabel: string;
  placeholder?: string;
  state?: TNewsletterSignupFormState;
};

/** The email field of a `NewsletterSignup.Form`. */
export const NewsletterSignupInput = ({
  emailAriaLabel,
  placeholder,
  state,
}: TNewsletterSignupInputProps) => {
  if (!state) return null;

  const { email, onChange, status, variant, errorId } = state;
  const s = newsletterSignupVariants({ variant });

  return (
    <TextInput
      value={email}
      onChange={onChange}
      ariaLabel={emailAriaLabel}
      leadingIcon={
        <Icon
          name={ICONS.CHEVRON_RIGHT}
          size={SIZE.SM}
          dataTestId="newsletter-signup-input-prompt"
        />
      }
      placeholder={placeholder}
      type="email"
      isInvalid={status === FORM_STATUS.ERROR}
      isDisabled={status === FORM_STATUS.SUBMITTING}
      aria-describedby={errorId}
      className={s.field()}
    />
  );
};
