import { customRender, screen } from '@blog/ui/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { NewsletterSignupCompact } from './newsletter-signup-compact';

const baseArgs = {
  email: '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  status: 'idle' as const,
  submitLabel: 'Subscribe',
  emailAriaLabel: 'Email address',
};

const setup = customRender(NewsletterSignupCompact, baseArgs);

describe(`<${NewsletterSignupCompact.name}/>`, () => {
  it('renders as a slim strip with no heading', () => {
    setup();

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('subscribe --email')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
  });

  it('marks the prompt glyph as decorative', () => {
    setup();
    expect(screen.getByText('$')).toHaveAttribute('aria-hidden', 'true');
  });

  it('calls onSubmit when the submit button is clicked', async () => {
    const onSubmit = vi.fn();
    setup({ onSubmit });

    await userEvent.click(screen.getByRole('button', { name: 'Subscribe' }));
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

  it('keeps the $ subscribe --email prompt visible on success', () => {
    const successMessage = 'Almost there — check your inbox to confirm.';
    setup({ status: 'success', successMessage });

    expect(screen.getByText('subscribe --email')).toBeVisible();
  });

  it('surfaces the error message inline and marks the field invalid', () => {
    const errorMessage = 'That email is already subscribed.';
    setup({ status: 'error', errorMessage });

    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'newsletter-signup-compact' });
    expect(screen.getByTestId('newsletter-signup-compact')).toBeVisible();
  });

  it('merges extra className on the root element', () => {
    const { container } = setup({ className: 'mt-8' });
    expect(container.firstChild).toHaveClass('mt-8');
  });
});
