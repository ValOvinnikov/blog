import userEvent from '@testing-library/user-event';
import {
  customRender,
  renderElement,
  screen,
  waitFor,
} from '@web/testing/custom-render';

import { NewsletterForm } from './newsletter-form';

const { subscribeToNewsletterActionMock } = vi.hoisted(() => ({
  subscribeToNewsletterActionMock: vi.fn(),
}));

vi.mock('@web/server/newsletter/newsletter-actions', () => ({
  subscribeToNewsletterAction: subscribeToNewsletterActionMock,
}));

const setup = customRender(NewsletterForm, {
  variant: 'full' as const,
  heading: 'Get new posts by email',
});

const typeAndSubmit = async (
  user: ReturnType<typeof userEvent.setup>,
  email: string,
) => {
  await user.type(
    screen.getByRole('textbox', { name: 'Email address' }),
    email,
  );
  await user.click(screen.getByRole('button', { name: 'Subscribe' }));
};

describe(`<${NewsletterForm.name}/>`, () => {
  beforeEach(() => {
    subscribeToNewsletterActionMock.mockReset();
  });

  afterEach(() => {
    // jsdom's `document.cookie` jar persists across `it`s in the same file —
    // expire anything a test set so it never leaks into the next one.
    document.cookie =
      'newsletter_subscribed=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('renders idle with a labeled field and submit button once mounted (no subscribed cookie)', () => {
    setup();

    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Subscribe' })).toBeVisible();
  });

  it('renders nothing once mounted when the newsletter_subscribed cookie is already present (full variant)', () => {
    document.cookie = 'newsletter_subscribed=1';

    const { container } = setup();

    expect(container).toBeEmptyDOMElement();
    expect(
      screen.queryByRole('textbox', { name: 'Email address' }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing once mounted when the newsletter_subscribed cookie is already present (compact variant)', () => {
    document.cookie = 'newsletter_subscribed=1';

    const { container } = setup({ variant: 'compact' });

    expect(container).toBeEmptyDOMElement();
    expect(
      screen.queryByRole('textbox', { name: 'Email address' }),
    ).not.toBeInTheDocument();
  });

  it('shows an inline error without calling the server action for a malformed email', async () => {
    const user = userEvent.setup();
    setup();

    await typeAndSubmit(user, 'not-an-email');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter a valid email address.',
    );
    expect(subscribeToNewsletterActionMock).not.toHaveBeenCalled();
  });

  it('associates the rendered error with the email field via its accessible description', async () => {
    const user = userEvent.setup();
    setup();

    await typeAndSubmit(user, 'not-an-email');

    await screen.findByRole('alert');
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(
      'Enter a valid email address.',
    );
  });

  it('gives each rendered instance its own errorMessageId, so two forms on one page never collide', async () => {
    const user = userEvent.setup();
    renderElement(
      <>
        <NewsletterForm variant="full" heading="First newsletter" />
        <NewsletterForm variant="full" heading="Second newsletter" />
      </>,
    );

    const [firstInput, secondInput] = screen.getAllByRole('textbox', {
      name: 'Email address',
    });
    const [firstButton, secondButton] = screen.getAllByRole('button', {
      name: 'Subscribe',
    });
    if (!firstInput || !secondInput || !firstButton || !secondButton) {
      throw new Error('Expected two rendered email fields and buttons.');
    }

    await user.type(firstInput, 'not-an-email');
    await user.click(firstButton);
    await user.type(secondInput, 'also-not-an-email');
    await user.click(secondButton);

    const alerts = await screen.findAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(firstInput).toHaveAccessibleDescription(
      'Enter a valid email address.',
    );
    expect(secondInput).toHaveAccessibleDescription(
      'Enter a valid email address.',
    );
    expect(firstInput.getAttribute('aria-describedby')).not.toBe(
      secondInput.getAttribute('aria-describedby'),
    );
  });

  it('marks the button busy while the server action is in flight', async () => {
    let resolveAction!: (result: { outcome: 'success' }) => void;
    subscribeToNewsletterActionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    setup();

    await typeAndSubmit(user, 'reader@example.com');

    const button = screen.getByRole('button', { name: 'Subscribe' });
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    resolveAction({ outcome: 'success' });

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeVisible();
    });
  });

  it('shows the success message once the server action resolves "success"', async () => {
    subscribeToNewsletterActionMock.mockResolvedValue({ outcome: 'success' });
    const user = userEvent.setup();
    setup();

    await typeAndSubmit(user, 'reader@example.com');

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Almost there — check your inbox to confirm.',
    );
    expect(subscribeToNewsletterActionMock).toHaveBeenCalledWith(
      'reader@example.com',
    );
  });

  it('shows the "already subscribed" error when the server action resolves "already-subscribed"', async () => {
    subscribeToNewsletterActionMock.mockResolvedValue({
      outcome: 'already-subscribed',
    });
    const user = userEvent.setup();
    setup();

    await typeAndSubmit(user, 'reader@example.com');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That email is already subscribed.',
    );
  });

  it('shows a generic error when the server action resolves "server-error"', async () => {
    subscribeToNewsletterActionMock.mockResolvedValue({
      outcome: 'server-error',
    });
    const user = userEvent.setup();
    setup();

    await typeAndSubmit(user, 'reader@example.com');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Something went wrong. Please try again.',
    );
  });

  it('forwards headingId to the rendered heading (full variant)', () => {
    setup({ headingId: 'newsletter-module-heading' });

    expect(
      screen.getByRole('heading', { name: 'Get new posts by email' }),
    ).toHaveAttribute('id', 'newsletter-module-heading');
  });

  it('forwards headingId to the rendered heading (compact variant)', () => {
    setup({ variant: 'compact', headingId: 'newsletter-compact-heading' });

    expect(screen.getByText('Get new posts by email')).toHaveAttribute(
      'id',
      'newsletter-compact-heading',
    );
  });

  it('renders the compact variant without supporting text', () => {
    setup({ variant: 'compact', supportingText: 'ignored in compact' });

    expect(screen.queryByText('ignored in compact')).not.toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Email address' }),
    ).toBeVisible();
  });

  it('renders the full variant with supporting text', () => {
    setup({ supportingText: 'Subscribe for updates.' });

    expect(screen.getByText('Subscribe for updates.')).toBeVisible();
  });

  it('renders trust cues for the full variant', () => {
    setup();

    expect(screen.getByText('No spam')).toBeVisible();
    expect(screen.getByText('Unsubscribe anytime')).toBeVisible();
  });

  it('does not render trust cues for the compact variant', () => {
    setup({ variant: 'compact' });

    expect(screen.queryByText('No spam')).not.toBeInTheDocument();
    expect(screen.queryByText('Unsubscribe anytime')).not.toBeInTheDocument();
  });
});
