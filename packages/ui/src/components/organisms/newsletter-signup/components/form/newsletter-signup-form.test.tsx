import { FORM_STATUS } from '@blog/config';
import { renderElement, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_NEWSLETTER_BUSY_LABEL,
  MOCK_NEWSLETTER_EMAIL_LABEL,
  MOCK_NEWSLETTER_SUBMIT_LABEL,
  MOCK_NEWSLETTER_SUCCESS_MESSAGE,
  makeNewsletterSignupForm,
} from '@blog/ui/testing/organisms/newsletter-signup/fixtures';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { NewsletterSignupForm } from './newsletter-signup-form';

faker.seed(123);

const PROMPT_TEST_ID = 'newsletter-signup-input-prompt';
const ERROR_ICON_TEST_ID = 'alert-icon';
const MOCK_ERROR_MESSAGE = faker.lorem.sentence();
const MOCK_EMAIL = faker.internet.email();
const MOCK_CHARACTER = faker.string.alpha(1);
const DESCRIBED_BY_ATTRIBUTE = 'aria-describedby';

const setup = (...args: Parameters<typeof makeNewsletterSignupForm>) =>
  renderElement(makeNewsletterSignupForm(...args));

const getEmailField = () =>
  screen.getByRole('textbox', { name: MOCK_NEWSLETTER_EMAIL_LABEL });

describe(`<${NewsletterSignupForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a labeled email field and submit button', () => {
      const submitButton = screen.getByRole('button', {
        name: MOCK_NEWSLETTER_SUBMIT_LABEL,
      });

      expect(getEmailField()).toBeVisible();
      expect(submitButton).toBeVisible();
    });

    it('renders the chevron icon as the email field prompt', () => {
      const prompt = screen.getByTestId(PROMPT_TEST_ID);

      expect(prompt).toBeVisible();
    });

    it('renders no success message', () => {
      const message = screen.queryByText(MOCK_NEWSLETTER_SUCCESS_MESSAGE);

      expect(message).not.toBeInTheDocument();
    });
  });

  it('forwards the typed character to onChange without keeping its own state', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    const emailField = getEmailField();
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
        await user.type(getEmailField(), '{Enter}');
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
      const button = screen.getByRole('button', {
        name: MOCK_NEWSLETTER_BUSY_LABEL,
      });

      expect(getEmailField()).toBeDisabled();
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
      setup({ status: FORM_STATUS.ERROR, errorMessage: MOCK_ERROR_MESSAGE });
    });

    it('surfaces the error message inline and marks the field invalid', () => {
      const message = screen.getByText(MOCK_ERROR_MESSAGE);

      expect(message).toBeVisible();
      expect(getEmailField()).toHaveAttribute('aria-invalid', 'true');
    });

    it('renders the error message without an icon', () => {
      const icon = screen.queryByTestId(ERROR_ICON_TEST_ID);

      expect(icon).not.toBeInTheDocument();
    });

    it('describes the email field by the error message', () => {
      expect(getEmailField()).toHaveAccessibleDescription(MOCK_ERROR_MESSAGE);
    });
  });

  describe('without an error status', () => {
    beforeEach(() => {
      setup({ errorMessage: MOCK_ERROR_MESSAGE });
    });

    it('renders no error message', () => {
      const message = screen.queryByText(MOCK_ERROR_MESSAGE);

      expect(message).not.toBeInTheDocument();
    });

    it('leaves the email field with no accessible description', () => {
      expect(getEmailField()).toHaveAccessibleDescription('');
    });
  });

  it('describes each email field by its own error when two forms share a page', () => {
    renderElement(
      <>
        {makeNewsletterSignupForm({
          status: FORM_STATUS.ERROR,
          errorMessage: MOCK_ERROR_MESSAGE,
        })}
        {makeNewsletterSignupForm({
          status: FORM_STATUS.ERROR,
          errorMessage: MOCK_ERROR_MESSAGE,
        })}
      </>,
    );

    const [firstField, secondField] = screen.getAllByRole('textbox', {
      name: MOCK_NEWSLETTER_EMAIL_LABEL,
    });

    expect(firstField).toHaveAccessibleDescription(MOCK_ERROR_MESSAGE);
    expect(secondField).toHaveAccessibleDescription(MOCK_ERROR_MESSAGE);
    expect(firstField?.getAttribute(DESCRIBED_BY_ATTRIBUTE)).not.toBe(
      secondField?.getAttribute(DESCRIBED_BY_ATTRIBUTE),
    );
  });

  describe('on success', () => {
    beforeEach(() => {
      setup({ status: FORM_STATUS.SUCCESS });
    });

    it('shows the success message in place of the field and button', () => {
      const message = screen.getByText(MOCK_NEWSLETTER_SUCCESS_MESSAGE);
      const emailField = screen.queryByRole('textbox', {
        name: MOCK_NEWSLETTER_EMAIL_LABEL,
      });
      const button = screen.queryByRole('button');

      expect(message).toBeVisible();
      expect(emailField).not.toBeInTheDocument();
      expect(button).not.toBeInTheDocument();
    });
  });
});
