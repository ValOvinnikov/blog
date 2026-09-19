import {
  ALERT_TYPE,
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
  type TFormStatus,
} from '@blog/config';
import { Alert } from '@blog/ui/atoms/alert';
import { Icon } from '@blog/ui/atoms/icon';
import { Panel } from '@blog/ui/molecules/panel';
import { NewsletterSignupContent } from '@blog/ui/organisms/newsletter-signup/components/content/newsletter-signup-content';
import {
  newsletterSignupVariants,
  type TNewsletterSignupVariants,
} from '@blog/ui/organisms/newsletter-signup/newsletter-signup-variants';
import type { ReactNode } from 'react';

export interface INewsletterSignupTrustCue {
  icon: ReactNode;
  label: string;
}

export type TNewsletterSignupFullProps = IWithClassName &
  IWithDataTestId & {
    email: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    status: TFormStatus;
    heading: string;
    headingId?: string;
    supportingText?: string;
    errorMessage?: string;
    errorMessageId?: string;
    successMessage?: string;
    submitLabel: string;
    emailAriaLabel: string;
    placeholder?: string;
    trustCues?: INewsletterSignupTrustCue[];
    align?: TNewsletterSignupVariants['align'];
  };

/** The rich, tinted panel signup form used by the site footer and the CMS page-builder module. */
export const NewsletterSignupFull = ({
  email,
  onChange,
  onSubmit,
  status,
  heading,
  headingId,
  supportingText,
  errorMessage,
  errorMessageId,
  successMessage,
  submitLabel,
  emailAriaLabel,
  placeholder,
  trustCues,
  align,
  className,
  dataTestId,
}: TNewsletterSignupFullProps) => {
  const isSuccess = status === 'success';
  const s = newsletterSignupVariants({ variant: 'full', align });

  return (
    <Panel className={s.root({ class: className })} dataTestId={dataTestId}>
      <Panel.Body className={s.body()}>
        <div className={s.pitchPane()}>
          <h3 id={headingId} className={s.heading()}>
            {heading}
          </h3>
          {supportingText && (
            <p className={s.supportingText()}>{supportingText}</p>
          )}
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
              errorMessageId={errorMessageId}
              submitLabel={submitLabel}
              emailAriaLabel={emailAriaLabel}
              placeholder={placeholder}
              inputPrompt={
                <Icon
                  name={ICONS.CHEVRON_RIGHT}
                  size={SIZE.SM}
                  dataTestId="newsletter-signup-input-prompt"
                />
              }
              variant="full"
            />
          )}
        </div>
      </Panel.Body>
    </Panel>
  );
};
