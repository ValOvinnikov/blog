import {
  ALERT_TYPE,
  type IWithDataTestId,
  type TFormStatus,
} from '@blog/config';
import { Alert } from '@blog/ui/atoms/alert';
import { WindowChrome } from '@blog/ui/molecules/window-chrome';
import { NewsletterSignupContent } from '@blog/ui/organisms/newsletter-signup/components/content/newsletter-signup-content';
import { newsletterSignupVariants } from '@blog/ui/organisms/newsletter-signup/newsletter-signup-variants';

export interface INewsletterSignupFullProps extends IWithDataTestId {
  email: string;
  onChange: (value: string) => void;
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
  onChange,
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
          <Alert type={ALERT_TYPE.SUCCESS} message={successMessage ?? ''} />
        ) : (
          <>
            {description && <p className={s.description()}>{description}</p>}
            <NewsletterSignupContent
              email={email}
              onChange={onChange}
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
