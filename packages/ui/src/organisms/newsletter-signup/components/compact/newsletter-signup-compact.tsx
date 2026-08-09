import {
  ALERT_TYPE,
  ICONS,
  Size,
  type IWithDataTestId,
  type TFormStatus,
} from '@blog/config';
import { Alert } from '@blog/ui/atoms/alert';
import { Icon } from '@blog/ui/atoms/icon';
import { NewsletterSignupContent } from '@blog/ui/organisms/newsletter-signup/components/content/newsletter-signup-content';
import { newsletterSignupVariants } from '@blog/ui/organisms/newsletter-signup/newsletter-signup-variants';
import type { ReactNode } from 'react';

export interface INewsletterSignupCompactProps extends IWithDataTestId {
  email: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  status: TFormStatus;
  heading: string;
  /** Decorative glyph or icon rendered ahead of `heading`, e.g. a `$` prompt — rendered as-is; the caller owns its wrapper, styling, and accessibility. */
  prefix?: ReactNode;
  errorMessage?: string;
  successMessage?: string;
  submitLabel: string;
  emailAriaLabel: string;
  placeholder?: string;
  className?: string;
}

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
  prefix,
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
      <span className={s.promptGroup()}>
        {prefix}
        <span className={s.label()}>{heading}</span>
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
