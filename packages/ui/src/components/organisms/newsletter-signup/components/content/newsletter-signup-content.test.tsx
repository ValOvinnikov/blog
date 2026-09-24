import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { NewsletterSignupContent } from './newsletter-signup-content';

faker.seed(123);

const baseArgs = {
  email: '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  submitLabel: 'Subscribe',
  emailAriaLabel: 'Email address',
  status: 'idle' as const,
  inputPrompt: (
    <span data-testid="newsletter-signup-content-prompt" aria-hidden="true">
      $
    </span>
  ),
  variant: 'full' as const,
};

const setup = customRender(NewsletterSignupContent, baseArgs);

describe(`<${NewsletterSignupContent.name}/>`, () => {
  it('renders a labeled email field and submit button', () => {
    setup();

    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  });

  it('associates the email field with its accessible label', () => {
    setup();

    expect(screen.getByLabelText('Email address')).toHaveAttribute(
      'type',
      'email',
    );
  });

  it('renders inputPrompt as the field leading icon', () => {
    setup();

    expect(
      screen.getByTestId('newsletter-signup-content-prompt'),
    ).toBeVisible();
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
          screen.getByRole('button', { name: 'Subscribe' }),
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

  it('submits through a real submit control, not an onClick shortcut', () => {
    setup();

    expect(screen.getByRole('button', { name: 'Subscribe' })).toHaveAttribute(
      'type',
      'submit',
    );
  });

  it('disables the field and button and marks the button busy while submitting', () => {
    setup({ status: 'submitting' });

    expect(screen.getByRole('textbox')).toBeDisabled();
    const button = screen.getByRole('button', { name: 'Subscribe' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the Spinner atom inside the button while submitting', () => {
    setup({ status: 'submitting' });

    const button = screen.getByRole('button', { name: 'Subscribe' });
    expect(screen.getByTestId('newsletter-signup-spinner')).toBeInTheDocument();
    expect(button).toContainElement(
      screen.getByTestId('newsletter-signup-spinner'),
    );
  });

  it('surfaces the error message inline and marks the field invalid', () => {
    const errorMessage = 'That email is already subscribed.';
    setup({ status: 'error', errorMessage });

    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not render an error when status is not error', () => {
    setup({ errorMessage: 'ignored while idle' });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('associates the email field with the error message via its accessible description', () => {
    const errorMessage = 'That email is already subscribed.';
    setup({
      status: 'error',
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
