import { FORM_STATUS } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_NEWSLETTER_BUSY_LABEL,
  MOCK_NEWSLETTER_EMAIL_LABEL,
  MOCK_NEWSLETTER_SUBMIT_LABEL,
  mockNewsletterSignupArgs,
} from '@blog/ui/testing/organisms/newsletter-signup/fixtures';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { NewsletterSignupContent } from './newsletter-signup-content';

faker.seed(123);

const PROMPT_TEST_ID = 'newsletter-signup-content-prompt';
const ERROR_ICON_TEST_ID = 'alert-icon';
const MOCK_ERROR_MESSAGE_ID = faker.string.uuid();
const MOCK_ERROR_MESSAGE = faker.lorem.sentence();
const MOCK_EMAIL = faker.internet.email();
const MOCK_CHARACTER = faker.string.alpha(1);

const baseArgs = {
  ...mockNewsletterSignupArgs(),
  inputPrompt: <span data-testid={PROMPT_TEST_ID} aria-hidden="true" />,
  variant: 'full' as const,
};

const setup = customRender(NewsletterSignupContent, baseArgs);

describe(`<${NewsletterSignupContent.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a labeled email field and submit button', () => {
      const emailField = screen.getByRole('textbox', {
        name: MOCK_NEWSLETTER_EMAIL_LABEL,
      });
      const submitButton = screen.getByRole('button', {
        name: MOCK_NEWSLETTER_SUBMIT_LABEL,
      });

      expect(emailField).toBeVisible();
      expect(submitButton).toBeVisible();
    });

    it('renders inputPrompt as the field leading icon', () => {
      const prompt = screen.getByTestId(PROMPT_TEST_ID);

      expect(prompt).toBeVisible();
    });
  });

  it('forwards the typed character to onChange without keeping its own state', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    const emailField = screen.getByRole('textbox', {
      name: MOCK_NEWSLETTER_EMAIL_LABEL,
    });
    await user.type(emailField, MOCK_CHARACTER);

    expect(onChange).toHaveBeenCalledWith(MOCK_CHARACTER);
    expect(emailField).toHaveValue('');
  });

  it.each([
    {
      name: 'clicking the submit button',
      submit: async (user: UserEvent) => {
        const submitButton = screen.getByRole('button', {
          name: MOCK_NEWSLETTER_SUBMIT_LABEL,
        });

        await user.click(submitButton);
      },
    },
    {
      name: 'pressing Enter in the field',
      submit: async (user: UserEvent) => {
        const emailField = screen.getByRole('textbox', {
          name: MOCK_NEWSLETTER_EMAIL_LABEL,
        });

        await user.type(emailField, '{Enter}');
      },
    },
  ])('calls onSubmit when $name', async ({ submit }) => {
    const onSubmit = vi.fn();
    setup({ onSubmit, email: MOCK_EMAIL });

    await submit(user);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  describe('while submitting', () => {
    let onSubmit: Mock<() => void>;

    beforeEach(() => {
      onSubmit = vi.fn();
      setup({ status: FORM_STATUS.SUBMITTING, onSubmit });
    });

    it('locks the field and marks the button busy', () => {
      const emailField = screen.getByRole('textbox', {
        name: MOCK_NEWSLETTER_EMAIL_LABEL,
      });
      const button = screen.getByRole('button', {
        name: MOCK_NEWSLETTER_BUSY_LABEL,
      });

      expect(emailField).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('keeps the button focusable', async () => {
      const button = screen.getByRole('button', {
        name: MOCK_NEWSLETTER_BUSY_LABEL,
      });

      await user.tab();

      expect(button).toHaveFocus();
    });

    it('announces that it is subscribing', () => {
      const status = screen.getByRole('status');

      expect(status).toHaveTextContent(MOCK_NEWSLETTER_BUSY_LABEL);
    });

    it('does not subscribe a second time', async () => {
      const button = screen.getByRole('button', {
        name: MOCK_NEWSLETTER_BUSY_LABEL,
      });

      await user.click(button);

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('with an error', () => {
    beforeEach(() => {
      setup({
        status: FORM_STATUS.ERROR,
        errorMessage: MOCK_ERROR_MESSAGE,
        errorMessageId: MOCK_ERROR_MESSAGE_ID,
      });
    });

    it('surfaces the error message inline and marks the field invalid', () => {
      const message = screen.getByText(MOCK_ERROR_MESSAGE);
      const emailField = screen.getByRole('textbox', {
        name: MOCK_NEWSLETTER_EMAIL_LABEL,
      });

      expect(message).toBeVisible();
      expect(emailField).toHaveAttribute('aria-invalid', 'true');
    });

    it('renders the error message without an icon', () => {
      const icon = screen.queryByTestId(ERROR_ICON_TEST_ID);

      expect(icon).not.toBeInTheDocument();
    });

    it('describes the email field by the error message', () => {
      const emailField = screen.getByRole('textbox', {
        name: MOCK_NEWSLETTER_EMAIL_LABEL,
      });

      expect(emailField).toHaveAccessibleDescription(MOCK_ERROR_MESSAGE);
    });
  });

  describe('without an error status', () => {
    beforeEach(() => {
      setup({
        errorMessage: MOCK_ERROR_MESSAGE,
        errorMessageId: MOCK_ERROR_MESSAGE_ID,
      });
    });

    it('renders no error message', () => {
      const message = screen.queryByText(MOCK_ERROR_MESSAGE);

      expect(message).not.toBeInTheDocument();
    });

    it('leaves the email field with no accessible description', () => {
      const emailField = screen.getByRole('textbox', {
        name: MOCK_NEWSLETTER_EMAIL_LABEL,
      });

      expect(emailField).toHaveAccessibleDescription('');
    });
  });
});
