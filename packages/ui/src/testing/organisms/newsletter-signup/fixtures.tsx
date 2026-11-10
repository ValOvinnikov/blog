import { FORM_STATUS, NEWSLETTER_VARIANT } from '@blog/config';
import type { TNewsletterSignupFormProps } from '@blog/ui/components/organisms/newsletter-signup/components/form/newsletter-signup-form';
import type { TNewsletterSignupInputProps } from '@blog/ui/components/organisms/newsletter-signup/components/input/newsletter-signup-input';
import type { TNewsletterSignupStatusProps } from '@blog/ui/components/organisms/newsletter-signup/components/status/newsletter-signup-status';
import type { TNewsletterSignupSubmitProps } from '@blog/ui/components/organisms/newsletter-signup/components/submit/newsletter-signup-submit';
import { NewsletterSignup } from '@blog/ui/components/organisms/newsletter-signup/newsletter-signup';
import { faker } from '@faker-js/faker';

export const MOCK_NEWSLETTER_SUBMIT_LABEL = faker.lorem.word();

export const MOCK_NEWSLETTER_BUSY_LABEL = faker.lorem.words(2);

export const MOCK_NEWSLETTER_EMAIL_LABEL = faker.lorem.words(2);

export const MOCK_NEWSLETTER_SUCCESS_MESSAGE = faker.lorem.sentence();

type TMakeNewsletterSignupForm = Partial<
  Omit<TNewsletterSignupFormProps, 'children'> &
    Omit<TNewsletterSignupInputProps, 'state'> &
    Omit<TNewsletterSignupSubmitProps, 'state'> &
    Omit<TNewsletterSignupStatusProps, 'state'>
>;

export const makeNewsletterSignupForm = ({
  email = '',
  onChange = () => {},
  onSubmit = () => {},
  status = FORM_STATUS.IDLE,
  variant = NEWSLETTER_VARIANT.FULL,
  busyStyle,
  spinnerVariant,
  emailAriaLabel = MOCK_NEWSLETTER_EMAIL_LABEL,
  placeholder,
  submitLabel = MOCK_NEWSLETTER_SUBMIT_LABEL,
  busyLabel = MOCK_NEWSLETTER_BUSY_LABEL,
  successMessage = MOCK_NEWSLETTER_SUCCESS_MESSAGE,
  errorMessage,
}: TMakeNewsletterSignupForm = {}) => (
  <NewsletterSignup.Form
    email={email}
    onChange={onChange}
    onSubmit={onSubmit}
    status={status}
    variant={variant}
    busyStyle={busyStyle}
    spinnerVariant={spinnerVariant}
  >
    <NewsletterSignup.Input
      emailAriaLabel={emailAriaLabel}
      placeholder={placeholder}
    />
    <NewsletterSignup.Submit submitLabel={submitLabel} busyLabel={busyLabel} />
    <NewsletterSignup.Status
      successMessage={successMessage}
      errorMessage={errorMessage}
    />
  </NewsletterSignup.Form>
);
