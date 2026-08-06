import {
  type IWithDataTestId,
  type TNewsletterSignupStatus,
} from '@blog/config';

import { NewsletterSignupFieldRow } from './newsletter-signup-field-row';
import { NewsletterSignupSuccessMessage } from './newsletter-signup-success-message';
import { newsletterSignupVariants } from './newsletter-signup-variants';

export interface INewsletterSignupCompactProps extends IWithDataTestId {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  status: TNewsletterSignupStatus;
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
 * has no room for a heading or description.
 */
export const NewsletterSignupCompact = ({
  email,
  onEmailChange,
  onSubmit,
  status,
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
      {isSuccess ? (
        <NewsletterSignupSuccessMessage
          message={successMessage}
          variant="compact"
        />
      ) : (
        <NewsletterSignupFieldRow
          email={email}
          onEmailChange={onEmailChange}
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
