import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { NewsletterSignup } from './newsletter-signup';

faker.seed(123);

const baseArgs = {
  email: '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  status: 'idle' as const,
  submitLabel: 'Subscribe',
  emailAriaLabel: 'Email address',
};

const setupFull = customRender(NewsletterSignup.Full, baseArgs);
const setupCompact = customRender(NewsletterSignup.Compact, baseArgs);

describe(`<${NewsletterSignup.Full.name}/>`, () => {
  it('renders the heading and description by default', () => {
    const heading = faker.lorem.sentence(3);
    const description = faker.lorem.sentence(8);
    setupFull({ heading, description });

    expect(screen.getByRole('heading', { name: heading })).toBeVisible();
    expect(screen.getByText(description)).toBeVisible();
  });

  it('renders a labeled email field and submit button', () => {
    setupFull();

    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  });

  it('calls onChange with the new value and does not manage its own state', async () => {
    const onChange = vi.fn();
    setupFull({ onChange });

    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('calls onSubmit when the submit button is clicked', async () => {
    const onSubmit = vi.fn();
    setupFull({ onSubmit });

    await userEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit when Enter is pressed in the field', async () => {
    const onSubmit = vi.fn();
    setupFull({ onSubmit, email: faker.internet.email() });

    await userEvent.type(screen.getByRole('textbox'), '{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables the field and button and marks the button busy while submitting', () => {
    setupFull({ status: 'submitting' });

    expect(screen.getByRole('textbox')).toBeDisabled();
    const button = screen.getByRole('button', { name: 'Subscribe' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the success message and hides the field on success', () => {
    const successMessage = 'Almost there — check your inbox to confirm.';
    setupFull({ status: 'success', successMessage });

    expect(screen.getByRole('status')).toHaveTextContent(successMessage);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('surfaces the error message inline and marks the field invalid', () => {
    const errorMessage = 'That email is already subscribed.';
    setupFull({ status: 'error', errorMessage });

    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not render an error when status is not error', () => {
    setupFull({ errorMessage: 'ignored while idle' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('forwards dataTestId to the root element', () => {
    setupFull({ dataTestId: 'newsletter-signup-full' });
    expect(screen.getByTestId('newsletter-signup-full')).toBeVisible();
  });

  it('merges extra className on the root element', () => {
    const { container } = setupFull({ className: 'mt-8' });
    expect(container.firstChild).toHaveClass('mt-8');
  });
});

describe(`<${NewsletterSignup.Compact.name}/>`, () => {
  it('renders as a slim strip with no heading', () => {
    setupCompact();

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('subscribe --email')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
  });

  it('marks the prompt glyph as decorative', () => {
    setupCompact();
    expect(screen.getByText('$')).toHaveAttribute('aria-hidden', 'true');
  });

  it('calls onSubmit when the submit button is clicked', async () => {
    const onSubmit = vi.fn();
    setupCompact({ onSubmit });

    await userEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables the field and button and marks the button busy while submitting', () => {
    setupCompact({ status: 'submitting' });

    expect(screen.getByRole('textbox')).toBeDisabled();
    const button = screen.getByRole('button', { name: 'Subscribe' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the success message and hides the field on success', () => {
    const successMessage = 'Almost there — check your inbox to confirm.';
    setupCompact({ status: 'success', successMessage });

    expect(screen.getByRole('status')).toHaveTextContent(successMessage);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('surfaces the error message inline and marks the field invalid', () => {
    const errorMessage = 'That email is already subscribed.';
    setupCompact({ status: 'error', errorMessage });

    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards dataTestId to the root element', () => {
    setupCompact({ dataTestId: 'newsletter-signup-compact' });
    expect(screen.getByTestId('newsletter-signup-compact')).toBeVisible();
  });

  it('merges extra className on the root element', () => {
    const { container } = setupCompact({ className: 'mt-8' });
    expect(container.firstChild).toHaveClass('mt-8');
  });
});
