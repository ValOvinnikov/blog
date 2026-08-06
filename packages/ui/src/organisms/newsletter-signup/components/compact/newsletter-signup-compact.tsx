import {
  ALERT_TYPE,
  type IWithDataTestId,
  type TFormStatus,
} from '@blog/config';
import { Alert } from '@blog/ui/atoms/alert';
import { NewsletterSignupContent } from '@blog/ui/organisms/newsletter-signup/components/content/newsletter-signup-content';
import { newsletterSignupVariants } from '@blog/ui/organisms/newsletter-signup/newsletter-signup-variants';

export interface INewsletterSignupCompactProps extends IWithDataTestId {
  email: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  status: TFormStatus;
  heading: string;
  errorMessage?: string;
  successMessage?: string;
  submitLabel: string;
  emailAriaLabel: string;
  placeholder?: string;
  className?: string;
}

/**
 * `NewsletterSignup.Compact` — a slim single-row `$ subscribe` strip for the
 * end of every article. Shares the same idle/submitting/success/error state
 * machine as `NewsletterSignup.Full`, driven entirely by the `status` prop;
 * has no room for a description. The `$` prompt and `heading` label stay
 * visible through every state, including success.
 */
export const NewsletterSignupCompact = ({
  email,
  onChange,
  onSubmit,
  status,
  heading,
  errorMessage,
  successMessage,
  submitLabel,
  emailAriaLabel,
  placeholder,
  className,
  dataTestId,
}: INewsletterSignupCompactProps) => {
  const isSuccess = status === 'success';
  const s = newsletterSignupVariants({ variant: 'compact' });

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <span className={s.prompt()} aria-hidden="true">
        $
      </span>
      <span className={s.label()}>{heading}</span>
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
          submitLabel={submitLabel}
          emailAriaLabel={emailAriaLabel}
          placeholder={placeholder}
          variant="compact"
        />
      )}
    </div>
  );
};
