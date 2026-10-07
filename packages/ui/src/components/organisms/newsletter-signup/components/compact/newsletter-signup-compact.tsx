import {
  ALERT_TYPE,
  ICONS,
  SIZE,
  type IWithClassName,
  type IWithDataTestId,
  type TFormStatus,
} from '@blog/config';
import { Alert } from '@blog/ui/components/atoms/alert';
import { Icon } from '@blog/ui/components/atoms/icon';
import { NewsletterSignupContent } from '@blog/ui/components/organisms/newsletter-signup/components/content/newsletter-signup-content';
import {
  newsletterSignupVariants,
  type TNewsletterSignupVariants,
} from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup-variants';
import type { ReactNode } from 'react';

export type TNewsletterSignupCompactProps = IWithClassName &
  IWithDataTestId & {
    email: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    status: TFormStatus;
    heading?: string;
    headingId?: string;
    prefix?: ReactNode;
    errorMessage?: string;
    errorMessageId?: string;
    successMessage?: string;
    submitLabel: string;
    emailAriaLabel: string;
    placeholder?: string;
    align?: TNewsletterSignupVariants['align'];
  };

/** A single-row subscribe strip with an inline label in place of a heading. */
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
  align,
  className,
  dataTestId,
}: TNewsletterSignupCompactProps) => {
  const isSuccess = status === 'success';
  const s = newsletterSignupVariants({ variant: 'compact', align });

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      {(prefix || heading) && (
        <span className={s.promptGroup()}>
          {prefix}
          {heading && (
            <span id={headingId} className={s.label()}>
              {heading}
            </span>
          )}
        </span>
      )}
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
              size={SIZE.SM}
              dataTestId="newsletter-signup-input-prompt"
            />
          }
          variant="compact"
        />
      )}
    </div>
  );
};
