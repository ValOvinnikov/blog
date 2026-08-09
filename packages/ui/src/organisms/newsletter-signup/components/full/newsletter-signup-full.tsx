import {
  ALERT_TYPE,
  ICONS,
  Size,
  type IWithDataTestId,
  type TFormStatus,
} from '@blog/config';
import { Alert } from '@blog/ui/atoms/alert';
import { Icon } from '@blog/ui/atoms/icon';
import { WindowChrome } from '@blog/ui/molecules/window-chrome';
import { NewsletterSignupContent } from '@blog/ui/organisms/newsletter-signup/components/content/newsletter-signup-content';
import { newsletterSignupVariants } from '@blog/ui/organisms/newsletter-signup/newsletter-signup-variants';
import type { ReactNode } from 'react';

export interface INewsletterSignupTrustCue {
  icon: ReactNode;
  label: string;
}

export interface INewsletterSignupFullProps extends IWithDataTestId {
  email: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  status: TFormStatus;
  heading: string;
  description?: string;
  errorMessage?: string;
  successMessage?: string;
  submitLabel: string;
  emailAriaLabel: string;
  placeholder?: string;
  /** Reassurance row (e.g. "no spam", "unsubscribe in one line") rendered under the pitch copy. Omit to skip the row entirely. */
  trustCues?: INewsletterSignupTrustCue[];
  className?: string;
}

/**
 * `NewsletterSignup.Full` — the rich, tinted window-shell signup form used
 * by the site footer and the CMS page-builder module. Pure and controlled:
 * it holds no state of its own and performs no email validation (the caller
 * supplies `errorMessage` for any invalid/duplicate/server failure), driven
 * entirely by the `status` prop. Splits into a pitch pane and a form pane
 * side by side on desktop, stacking to one column on mobile.
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
  trustCues,
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
      <WindowChrome.Body className={s.body()}>
        <div className={s.pitchPane()}>
          <h3 className={s.heading()}>{heading}</h3>
          {description && <p className={s.description()}>{description}</p>}
          {trustCues && trustCues.length > 0 && (
            <ul className={s.trustCues()}>
              {trustCues.map((cue) => (
                <li key={cue.label} className={s.trustCue()}>
                  <span aria-hidden="true" className={s.trustCueIcon()}>
                    {cue.icon}
                  </span>
                  {cue.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={s.formPane()}>
          {isSuccess ? (
            <Alert type={ALERT_TYPE.SUCCESS} message={successMessage ?? ''} />
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
              inputPrompt={
                <Icon
                  name={ICONS.CHEVRON_RIGHT}
                  size={Size.SM}
                  dataTestId="newsletter-signup-input-prompt"
                />
              }
              variant="full"
            />
          )}
        </div>
      </WindowChrome.Body>
    </WindowChrome>
  );
};
