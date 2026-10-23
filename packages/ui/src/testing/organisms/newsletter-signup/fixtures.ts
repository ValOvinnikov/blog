import { FORM_STATUS } from '@blog/config';
import { faker } from '@faker-js/faker';

export const MOCK_NEWSLETTER_SUBMIT_LABEL = faker.lorem.word();

export const MOCK_NEWSLETTER_EMAIL_LABEL = faker.lorem.words(2);

export const mockNewsletterSignupArgs = () => ({
  email: '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  status: FORM_STATUS.IDLE,
  submitLabel: MOCK_NEWSLETTER_SUBMIT_LABEL,
  emailAriaLabel: MOCK_NEWSLETTER_EMAIL_LABEL,
});
