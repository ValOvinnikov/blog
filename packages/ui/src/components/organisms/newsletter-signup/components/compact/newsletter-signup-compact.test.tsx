import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

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

  it('shows the success message and hides the field on success', () => {
    const successMessage = faker.lorem.sentence();
    setup({ status: 'success', successMessage });

    expect(screen.getByRole('status')).toHaveTextContent(successMessage);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('keeps the prefix and heading visible on success', () => {
    const successMessage = faker.lorem.sentence();
    setup({ status: 'success', successMessage });

    expect(
      screen.getByTestId('newsletter-signup-compact-prefix'),
    ).toBeVisible();
    expect(screen.getByText('subscribe --email')).toBeVisible();
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'newsletter-signup-compact' });
    expect(screen.getByTestId('newsletter-signup-compact')).toBeVisible();
  });
});
