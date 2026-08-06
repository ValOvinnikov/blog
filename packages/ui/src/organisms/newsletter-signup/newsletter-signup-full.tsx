import { type IWithDataTestId, type TFormStatus } from '@blog/config';
import { WindowChrome } from '@blog/ui/molecules/window-chrome';

import { NewsletterSignupFieldRow } from './newsletter-signup-field-row';
import { NewsletterSignupSuccessMessage } from './newsletter-signup-success-message';
import { newsletterSignupVariants } from './newsletter-signup-variants';

export interface INewsletterSignupFullProps extends IWithDataTestId {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  status: TFormStatus;
  heading?: string;
  description?: string;
  errorMessage?: string;
  successMessage?: string;
  submitLabel: string;
  emailAriaLabel: string;
  placeholder?: string;
  className?: string;
}

/**
 * `NewsletterSignup.Full` — the rich, tinted window-shell signup form used
 * by the site footer and the CMS page-builder module. Pure and controlled:
 * it holds no state of its own and performs no email validation (the caller
 * supplies `errorMessage` for any invalid/duplicate/server failure), driven
 * entirely by the `status` prop.
 */
export const NewsletterSignupFull = ({
  email,
  onEmailChange,
  onSubmit,
  status,
  heading,
  description,
  errorMessage,
  successMessage,
  submitLabel,
  emailAriaLabel,
  placeholder,
  className,
  dataTestId,
}: INewsletterSignupFullProps) => {
  const isSuccess = status === 'success';
  const s = newsletterSignupVariants({ variant: 'full' });

  return (
    <WindowChrome
      className={s.root({ class: className })}
      dataTestId={dataTestId}
    >
      <WindowChrome.Body>
        {heading && <h3 className={s.heading()}>{heading}</h3>}
        {isSuccess ? (
          <NewsletterSignupSuccessMessage
            message={successMessage}
            variant="full"
          />
        ) : (
          <>
            {description && <p className={s.description()}>{description}</p>}
            <NewsletterSignupFieldRow
              email={email}
              onEmailChange={onEmailChange}
              onSubmit={onSubmit}
              status={status}
              errorMessage={errorMessage}
              submitLabel={submitLabel}
              emailAriaLabel={emailAriaLabel}
              placeholder={placeholder}
              variant="full"
            />
          </>
        )}
      </WindowChrome.Body>
    </WindowChrome>
  );
};
