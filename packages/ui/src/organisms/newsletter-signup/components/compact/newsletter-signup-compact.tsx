import {
  ALERT_TYPE,
  ICONS,
  Size,
  type IWithClassName,
  type IWithDataTestId,
  type TFormStatus,
} from '@blog/config';
import { Alert } from '@blog/ui/atoms/alert';
import { Icon } from '@blog/ui/atoms/icon';
import { NewsletterSignupContent } from '@blog/ui/organisms/newsletter-signup/components/content/newsletter-signup-content';
import { newsletterSignupVariants } from '@blog/ui/organisms/newsletter-signup/newsletter-signup-variants';
import type { ReactNode } from 'react';

export type TNewsletterSignupCompactProps = IWithClassName &
  IWithDataTestId & {
    email: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    status: TFormStatus;
    heading: string;
    headingId?: string;
    /** Decorative glyph or icon rendered ahead of `heading`, e.g. a `$` prompt — rendered as-is; the caller owns its wrapper, styling, and accessibility. */
    prefix?: ReactNode;
    errorMessage?: string;
    /** Id for the error `Alert`, passed to the email `TextInput` as `aria-describedby` while the error is showing. Caller-generated so two instances on one page never collide. */
    errorMessageId?: string;
    successMessage?: string;
    submitLabel: string;
    emailAriaLabel: string;
    placeholder?: string;
  };

/**
 * `NewsletterSignup.Compact` — a slim single-row subscribe strip for the end
 * of every article. Shares the same idle/submitting/success/error state
 * machine as `NewsletterSignup.Full`, driven entirely by the `status` prop;
 * has no room for a description. `prefix` and `heading` stay visible through
 * every state, including success.
 */
export const NewsletterSignupCompact = ({
  email,
  onChange,
  onSubmit,
  status,
  heading,
  headingId,
  prefix,
  errorMessage,
  errorMessageId,
  successMessage,
  submitLabel,
  emailAriaLabel,
  placeholder,
  className,
  dataTestId,
}: TNewsletterSignupCompactProps) => {
  const isSuccess = status === 'success';
  const s = newsletterSignupVariants({ variant: 'compact' });

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <span className={s.promptGroup()}>
        {prefix}
        <span id={headingId} className={s.label()}>
          {heading}
        </span>
      </span>
      {isSuccess ? (
        <Alert
          type={ALERT_TYPE.SUCCESS}
          message={successMessage ?? ''}
          className={s.alert()}
        />
      ) : (
        <NewsletterSignupContent
          email={email}
          onChange={onChange}
          onSubmit={onSubmit}
          status={status}
          errorMessage={errorMessage}
          errorMessageId={errorMessageId}
          submitLabel={submitLabel}
          emailAriaLabel={emailAriaLabel}
          placeholder={placeholder}
          inputPrompt={
            <Icon
              name={ICONS.CHEVRON_RIGHT}
              size={Size.SM}
              dataTestId="newsletter-signup-input-prompt"
            />
          }
          variant="compact"
        />
      )}
    </div>
  );
};
