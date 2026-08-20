import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { NewsletterSignupCompact } from './newsletter-signup-compact';

faker.seed(123);

const baseArgs = {
  email: '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  status: 'idle' as const,
  heading: 'subscribe --email',
  prefix: (
    <span data-testid="newsletter-signup-compact-prefix" aria-hidden="true">
      $
    </span>
  ),
  submitLabel: 'Subscribe',
  emailAriaLabel: 'Email address',
};

const setup = customRender(NewsletterSignupCompact, baseArgs);

describe(`<${NewsletterSignupCompact.name}/>`, () => {
  it('renders as a slim strip with no heading element', () => {
    setup();

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('subscribe --email')).toBeVisible();
    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
  });

  it('renders the heading prop as the label text', () => {
    const heading = faker.lorem.sentence(3);
    setup({ heading });

    expect(screen.getByText(heading)).toBeVisible();
  });

  it('assigns headingId to the label element when provided', () => {
    setup({ headingId: 'newsletter-compact-heading' });

    expect(screen.getByText('subscribe --email')).toHaveAttribute(
      'id',
      'newsletter-compact-heading',
    );
  });

  it('renders the label with no id when headingId is omitted', () => {
    setup();

    expect(screen.getByText('subscribe --email')).not.toHaveAttribute('id');
  });

  it('renders the prefix node as-is, ahead of the heading', () => {
    setup();

    const prefix = screen.getByTestId('newsletter-signup-compact-prefix');
    expect(prefix).toHaveTextContent('$');
    expect(
      prefix.compareDocumentPosition(screen.getByText('subscribe --email')),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('renders no prefix element when prefix is omitted', () => {
    setup({ prefix: undefined });

    expect(
      screen.queryByTestId('newsletter-signup-compact-prefix'),
    ).not.toBeInTheDocument();
  });

  it('renders the chevron icon as the email field prompt', () => {
    setup();
    expect(screen.getByTestId('newsletter-signup-input-prompt')).toBeVisible();
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

  it('shows the success message and hides the field on success', () => {
    const successMessage = 'Almost there — check your inbox to confirm.';
    setup({ status: 'success', successMessage });

    expect(screen.getByRole('status')).toHaveTextContent(successMessage);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('keeps the prefix and heading visible on success', () => {
    const successMessage = 'Almost there — check your inbox to confirm.';
    setup({ status: 'success', successMessage });

    expect(
      screen.getByTestId('newsletter-signup-compact-prefix'),
    ).toBeVisible();
    expect(screen.getByText('subscribe --email')).toBeVisible();
  });

  it('surfaces the error message inline and marks the field invalid', () => {
    const errorMessage = 'That email is already subscribed.';
    setup({ status: 'error', errorMessage });

    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('associates the email field with the error message via its accessible description', () => {
    const errorMessage = 'That email is already subscribed.';
    setup({
      status: 'error',
      errorMessage,
      errorMessageId: 'newsletter-compact-error',
    });

    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      errorMessage,
    );
  });

  it('has no accessible description or aria-describedby when there is no error', () => {
    setup({ errorMessageId: 'newsletter-compact-error' });

    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('');
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
