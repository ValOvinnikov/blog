import { FORM_STATUS } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_NEWSLETTER_EMAIL_LABEL,
  mockNewsletterSignupArgs,
} from '@blog/ui/testing/organisms/newsletter-signup/fixtures';
import { faker } from '@faker-js/faker';

import { NewsletterSignupCompact } from './newsletter-signup-compact';

faker.seed(123);

const PREFIX_TEST_ID = 'newsletter-signup-compact-prefix';
const PROMPT_TEST_ID = 'newsletter-signup-input-prompt';
const MOCK_HEADING = faker.lorem.words(2);
const MOCK_HEADING_ID = faker.string.uuid();
const MOCK_SUCCESS_MESSAGE = faker.lorem.sentence();

const baseArgs = {
  ...mockNewsletterSignupArgs(),
  heading: MOCK_HEADING,
  prefix: <span data-testid={PREFIX_TEST_ID} aria-hidden="true" />,
};

const setup = customRender(NewsletterSignupCompact, baseArgs);

describe(`<${NewsletterSignupCompact.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders as a slim strip with no heading element', () => {
      const headingElement = screen.queryByRole('heading', {
        name: MOCK_HEADING,
      });
      const label = screen.getByText(MOCK_HEADING);
      const emailField = screen.getByRole('textbox', {
        name: MOCK_NEWSLETTER_EMAIL_LABEL,
      });

      expect(headingElement).not.toBeInTheDocument();
      expect(label).toBeVisible();
      expect(emailField).toBeVisible();
    });

    it('renders the prefix ahead of the heading', () => {
      const prefix = screen.getByTestId(PREFIX_TEST_ID);
      const label = screen.getByText(MOCK_HEADING);

      expect(prefix.compareDocumentPosition(label)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it('renders the chevron icon as the email field prompt', () => {
      const prompt = screen.getByTestId(PROMPT_TEST_ID);

      expect(prompt).toBeVisible();
    });
  });

  it('assigns headingId to the label element when provided', () => {
    setup({ headingId: MOCK_HEADING_ID });

    const label = screen.getByText(MOCK_HEADING);

    expect(label).toHaveAttribute('id', MOCK_HEADING_ID);
  });

  it('renders only the form when heading and prefix are omitted', () => {
    setup({ heading: undefined, prefix: undefined });

    const label = screen.queryByText(MOCK_HEADING);
    const prefix = screen.queryByTestId(PREFIX_TEST_ID);
    const emailField = screen.getByRole('textbox', {
      name: MOCK_NEWSLETTER_EMAIL_LABEL,
    });

    expect(label).not.toBeInTheDocument();
    expect(prefix).not.toBeInTheDocument();
    expect(emailField).toBeVisible();
  });

  describe('on success', () => {
    beforeEach(() => {
      setup({
        status: FORM_STATUS.SUCCESS,
        successMessage: MOCK_SUCCESS_MESSAGE,
      });
    });

    it('shows the success message and hides the field', () => {
      const message = screen.getByText(MOCK_SUCCESS_MESSAGE);
      const emailField = screen.queryByRole('textbox', {
        name: MOCK_NEWSLETTER_EMAIL_LABEL,
      });

      expect(message).toBeVisible();
      expect(emailField).not.toBeInTheDocument();
    });

    it('keeps the prefix and heading visible', () => {
      const prefix = screen.getByTestId(PREFIX_TEST_ID);
      const label = screen.getByText(MOCK_HEADING);

      expect(prefix).toBeVisible();
      expect(label).toBeVisible();
    });
  });
});
