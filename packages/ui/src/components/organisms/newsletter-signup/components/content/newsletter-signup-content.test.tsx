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
      expect(screen.getByRole('textbox', { name: EMAIL_LABEL })).toBeVisible();
      expect(screen.getByRole('button', { name: SUBMIT_LABEL })).toBeVisible();
    });

    it('associates the email field with its accessible label', () => {
      expect(screen.getByLabelText(EMAIL_LABEL)).toHaveAttribute(
        'type',
        'email',
      );
    });

    it('renders inputPrompt as the field leading icon', () => {
      expect(
        screen.getByTestId('newsletter-signup-content-prompt'),
      ).toBeVisible();
    });

    it('submits through a real submit control, not an onClick shortcut', () => {
      expect(
        screen.getByRole('button', { name: SUBMIT_LABEL }),
      ).toHaveAttribute('type', 'submit');
    });
  });

  it('forwards the typed character to onChange and does not manage its own state', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    await userEvent.type(screen.getByRole('textbox'), 'x');
    expect(onChange).toHaveBeenCalledWith('x');
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it.each([
    {
      name: 'clicking the submit button',
      submit: async () => {
        await userEvent.click(
          screen.getByRole('button', { name: SUBMIT_LABEL }),
        );
      },
    },
    {
      name: 'pressing Enter in the field',
      submit: async () => {
        await userEvent.type(screen.getByRole('textbox'), '{Enter}');
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
      expect(screen.getByRole('textbox')).toBeDisabled();
      const button = screen.getByRole('button', { name: SUBMIT_LABEL });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('shows the Spinner atom inside the button while submitting', () => {
      const button = screen.getByRole('button', { name: SUBMIT_LABEL });
      expect(screen.getByTestId('newsletter-signup-spinner')).toBeVisible();
      expect(button).toContainElement(
        screen.getByTestId('newsletter-signup-spinner'),
      );
    });
  });

  it('surfaces the error message inline and marks the field invalid', () => {
    setup({ status: FORM_STATUS.ERROR, errorMessage });

    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders the error message without an icon', () => {
    setup({
      status: FORM_STATUS.ERROR,
      errorMessage,
    });

    expect(screen.getByRole('alert')).toBeVisible();
    expect(screen.queryByTestId('alert-icon')).not.toBeInTheDocument();
  });

  it('does not render an error when status is not error', () => {
    setup({ errorMessage: faker.lorem.sentence() });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('associates the email field with the error message via its accessible description', () => {
    setup({
      status: FORM_STATUS.ERROR,
      errorMessage,
      errorMessageId: 'newsletter-content-error',
    });

    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      errorMessage,
    );
  });

  it('has no accessible description or aria-describedby when there is no error', () => {
    setup({ errorMessageId: 'newsletter-content-error' });

    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('');
  });
});
