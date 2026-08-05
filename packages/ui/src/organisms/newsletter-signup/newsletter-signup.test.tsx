import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { NewsletterSignup } from './newsletter-signup';

faker.seed(123);

const setup = customRender(NewsletterSignup, {
  email: '',
  onEmailChange: vi.fn(),
  onSubmit: vi.fn(),
  status: 'idle',
  submitLabel: 'Subscribe',
  emailAriaLabel: 'Email address',
});

describe(`<${NewsletterSignup.name}/>`, () => {
  it('renders the full variant heading and description by default', () => {
    const heading = faker.lorem.sentence(3);
    const description = faker.lorem.sentence(8);
    setup({ heading, description });

    expect(screen.getByRole('heading', { name: heading })).toBeVisible();
    expect(screen.getByText(description)).toBeVisible();
  });

  it('renders a labeled email field and submit button', () => {
    setup();

    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  });

  it('calls onEmailChange with the new value and does not manage its own state', async () => {
    const onEmailChange = vi.fn();
    setup({ onEmailChange });

    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(onEmailChange).toHaveBeenCalledWith('a');
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('calls onSubmit when the submit button is clicked', async () => {
    const onSubmit = vi.fn();
    setup({ onSubmit });

    await userEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit when Enter is pressed in the field', async () => {
    const onSubmit = vi.fn();
    setup({ onSubmit, email: faker.internet.email() });

    await userEvent.type(screen.getByRole('textbox'), '{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables the field and button and marks the button busy while submitting', () => {
    setup({ status: 'submitting' });

    expect(screen.getByRole('textbox')).toBeDisabled();
    const button = screen.getByRole('button', { name: 'Subscribe' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the success message and hides the field on success', () => {
    const successMessage = 'Almost there — check your inbox to confirm.';
    setup({ status: 'success', successMessage });

    expect(screen.getByRole('status')).toHaveTextContent(successMessage);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
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

  it('renders the compact variant as a slim strip, hiding heading and description', () => {
    const heading = faker.lorem.sentence(3);
    const description = faker.lorem.sentence(8);
    setup({ variant: 'compact', heading, description });

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByText(description)).not.toBeInTheDocument();
    expect(screen.getByText('subscribe --email')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
  });

  it('marks the compact prompt glyph as decorative', () => {
    setup({ variant: 'compact' });
    expect(screen.getByText('$')).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'newsletter-signup' });
    expect(screen.getByTestId('newsletter-signup')).toBeVisible();
  });

  it('merges extra className on the root element', () => {
    const { container } = setup({ className: 'mt-8' });
    expect(container.firstChild).toHaveClass('mt-8');
  });
});
