import { ICONS, type IWithDataTestId } from '@blog/config';
import { Button } from '@blog/ui/atoms/button';
import { Icon } from '@blog/ui/atoms/icon';
import { TextInput } from '@blog/ui/atoms/text-input';
import { WindowChrome } from '@blog/ui/molecules/window-chrome';
import { type FormEvent } from 'react';

import { newsletterSignupVariants } from './newsletter-signup-variants';

export type TNewsletterSignupStatus =
  'idle' | 'submitting' | 'success' | 'error';

export type TNewsletterSignupVariant = 'full' | 'compact';

export interface INewsletterSignupProps extends IWithDataTestId {
  email: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  status: TNewsletterSignupStatus;
  variant?: TNewsletterSignupVariant;
  /** Heading text — rendered in the `full` variant only; `compact` has no room for it. */
  heading?: string;
  /** Supporting copy — rendered in the `full` variant only. */
  description?: string;
  errorMessage?: string;
  successMessage?: string;
  submitLabel: string;
  emailAriaLabel: string;
  placeholder?: string;
  className?: string;
}

/**
 * NewsletterSignup — a pure, controlled subscribe form built on the
 * `TextInput` atom. The `full` density is the rich, tinted window-shell
 * signup used by the site footer and the CMS page-builder module; `compact`
 * is a slim single-row `$ subscribe` strip for the end of every article. Both
 * densities share the same idle/submitting/success/error state machine,
 * driven entirely by the `status` prop — this component holds no state of
 * its own and performs no email validation (the caller supplies
 * `errorMessage` for any invalid/duplicate/server failure).
 */
export const NewsletterSignup = ({
  email,
  onEmailChange,
  onSubmit,
  status,
  variant = 'full',
  heading,
  description,
  errorMessage,
  successMessage,
  submitLabel,
  emailAriaLabel,
  placeholder,
  className,
  dataTestId,
}: INewsletterSignupProps) => {
  const isCompact = variant === 'compact';
  const isSubmitting = status === 'submitting';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const s = newsletterSignupVariants({ variant });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const successRow = (
    <p className={s.success()} role="status">
      <span aria-hidden="true">✓</span>
      <span>{successMessage}</span>
      <span className={s.cursor()} aria-hidden="true" />
    </p>
  );

  const fieldRow = (
    <form className={s.form()} onSubmit={handleSubmit} noValidate>
      {isCompact && (
        <>
          <span className={s.prompt()} aria-hidden="true">
            $
          </span>
          <span className={s.label()}>subscribe --email</span>
        </>
      )}
      <TextInput
        value={email}
        onChange={onEmailChange}
        ariaLabel={emailAriaLabel}
        prompt="›"
        placeholder={placeholder}
        type="email"
        invalid={isError}
        disabled={isSubmitting}
        className={s.field()}
      />
      <Button
        variant="primary"
        onClick={onSubmit}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className={s.submit()}
      >
        {isSubmitting && <Icon name={ICONS.SPINNER} className={s.spinner()} />}
        {submitLabel}
      </Button>
      {isError && errorMessage && (
        <p className={s.error()} role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );

  if (isCompact) {
    return (
      <div className={s.root({ class: className })} data-testid={dataTestId}>
        {isSuccess ? successRow : fieldRow}
      </div>
    );
  }

  return (
    <WindowChrome
      className={s.root({ class: className })}
      dataTestId={dataTestId}
    >
      <WindowChrome.Body>
        {heading && <h3 className={s.heading()}>{heading}</h3>}
        {isSuccess ? (
          successRow
        ) : (
          <>
            {description && <p className={s.description()}>{description}</p>}
            {fieldRow}
          </>
        )}
      </WindowChrome.Body>
    </WindowChrome>
  );
};
