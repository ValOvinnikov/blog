import { FORM_STATUS } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { NewsletterSignupContent } from './newsletter-signup-content';

faker.seed(123);

const SUBMIT_LABEL = faker.lorem.word();
const EMAIL_LABEL = faker.lorem.words(2);

const baseArgs = {
  email: '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  submitLabel: SUBMIT_LABEL,
  emailAriaLabel: EMAIL_LABEL,
  status: FORM_STATUS.IDLE,
  inputPrompt: (
    <span data-testid="newsletter-signup-content-prompt" aria-hidden="true">
      $
    </span>
  ),
  variant: 'full' as const,
};

const errorMessage = faker.lorem.sentence();

const setup = customRender(NewsletterSignupContent, baseArgs);

describe(`<${NewsletterSignupContent.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a labeled email field and submit button', () => {
      const emailField = screen.getByRole('textbox', { name: EMAIL_LABEL });
      const submitButton = screen.getByRole('button', { name: SUBMIT_LABEL });

      expect(emailField).toBeVisible();
      expect(submitButton).toBeVisible();
    });

    it('associates the email field with its accessible label', () => {
      const emailField = screen.getByLabelText(EMAIL_LABEL);

      expect(emailField).toHaveAttribute('type', 'email');
    });

    it('renders inputPrompt as the field leading icon', () => {
      const prompt = screen.getByTestId('newsletter-signup-content-prompt');

      expect(prompt).toBeVisible();
    });

    it('submits through a real submit control, not an onClick shortcut', () => {
      const submitButton = screen.getByRole('button', { name: SUBMIT_LABEL });

      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  it('forwards the typed character to onChange and does not manage its own state', async () => {
    const onChange = vi.fn();
    const character = faker.string.alpha(1);
    setup({ onChange });
    const emailField = screen.getByRole('textbox');

    await userEvent.type(emailField, character);

    expect(onChange).toHaveBeenCalledWith(character);
    expect(emailField).toHaveValue('');
  });

  it.each([
    {
      name: 'clicking the submit button',
      submit: async () => {
        const submitButton = screen.getByRole('button', {
          name: SUBMIT_LABEL,
        });
        await userEvent.click(submitButton);
      },
    },
    {
      name: 'pressing Enter in the field',
      submit: async () => {
        const emailField = screen.getByRole('textbox');
        await userEvent.type(emailField, '{Enter}');
      },
    },
  ])('calls onSubmit when $name', async ({ submit }) => {
    const onSubmit = vi.fn();
    setup({ onSubmit, email: faker.internet.email() });

    await submit();

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  describe('while submitting', () => {
    beforeEach(() => {
      setup({ status: FORM_STATUS.SUBMITTING });
    });

    it('disables the field and button and marks the button busy while submitting', () => {
      const emailField = screen.getByRole('textbox');
      const button = screen.getByRole('button', { name: SUBMIT_LABEL });

      expect(emailField).toBeDisabled();
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('shows the Spinner atom inside the button while submitting', () => {
      const button = screen.getByRole('button', { name: SUBMIT_LABEL });
      const spinner = screen.getByTestId('newsletter-signup-spinner');

      expect(spinner).toBeVisible();
      expect(button).toContainElement(spinner);
    });
  });

  it('surfaces the error message inline and marks the field invalid', () => {
    setup({ status: FORM_STATUS.ERROR, errorMessage });

    const alert = screen.getByRole('alert');
    const emailField = screen.getByRole('textbox');

    expect(alert).toHaveTextContent(errorMessage);
    expect(emailField).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders the error message without an icon', () => {
    setup({
      status: FORM_STATUS.ERROR,
      errorMessage,
    });

    const alert = screen.getByRole('alert');
    const icon = screen.queryByTestId('alert-icon');

    expect(alert).toBeVisible();
    expect(icon).not.toBeInTheDocument();
  });

  it('does not render an error when status is not error', () => {
    setup({ errorMessage: faker.lorem.sentence() });

    const alert = screen.queryByRole('alert');

    expect(alert).not.toBeInTheDocument();
  });

  it('associates the email field with the error message via its accessible description', () => {
    setup({
      status: FORM_STATUS.ERROR,
      errorMessage,
      errorMessageId: 'newsletter-content-error',
    });

    const emailField = screen.getByRole('textbox');

    expect(emailField).toHaveAccessibleDescription(errorMessage);
  });

  it('has no accessible description or aria-describedby when there is no error', () => {
    setup({ errorMessageId: 'newsletter-content-error' });

    const emailField = screen.getByRole('textbox');

    expect(emailField).not.toHaveAttribute('aria-describedby');
    expect(emailField).toHaveAccessibleDescription('');
  });
});
