import { customRenderAsync, screen } from '@web/testing/custom-render';

import { NewsletterSection } from './newsletter-section';

const { authMock, getSubscriptionStatusMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getSubscriptionStatusMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: {
    subscribers: { getSubscriptionStatus: getSubscriptionStatusMock },
  },
}));

vi.mock('@web/components/shared/newsletter-subscription-control', () => ({
  NewsletterSubscriptionControl: ({ action }: { action: string }) => (
    <div data-testid="newsletter-subscription-control">{action}</div>
  ),
}));

const setup = customRenderAsync(NewsletterSection, {});

const authedSession = {
  user: { id: 'user-1', name: 'Jane Doe', email: 'jane@icloud.com' },
};

describe(`<${NewsletterSection.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getSubscriptionStatusMock.mockReset();
  });

  it('renders nothing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(getSubscriptionStatusMock).not.toHaveBeenCalled();
  });

  it('renders nothing when the account is not subscribed', async () => {
    authMock.mockResolvedValue(authedSession);
    getSubscriptionStatusMock.mockResolvedValue({ outcome: 'not-subscribed' });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the subscribed state with the account email and an unsubscribe control', async () => {
    authMock.mockResolvedValue(authedSession);
    getSubscriptionStatusMock.mockResolvedValue({
      outcome: 'active',
      subscriber: { email: 'jane@icloud.com' },
    });

    await setup();

    expect(screen.getByText('~$')).toBeVisible();
    expect(screen.getByText(/account --email/)).toBeVisible();
    expect(screen.getByText('subscribed')).toBeVisible();
    expect(screen.getByText('jane@icloud.com')).toBeVisible();
    expect(
      screen.getByTestId('newsletter-subscription-control'),
    ).toHaveTextContent('unsubscribe');
  });

  it('renders the bar as a level-2 heading', async () => {
    authMock.mockResolvedValue(authedSession);
    getSubscriptionStatusMock.mockResolvedValue({
      outcome: 'active',
      subscriber: { email: 'jane@icloud.com' },
    });

    await setup();

    expect(screen.getByRole('heading', { level: 2 })).toBeVisible();
  });

  it('renders the pending state with a resend control', async () => {
    authMock.mockResolvedValue(authedSession);
    getSubscriptionStatusMock.mockResolvedValue({
      outcome: 'pending',
      subscriber: { email: 'jane@icloud.com' },
    });

    await setup();

    expect(screen.getByText('pending confirmation')).toBeVisible();
    expect(
      screen.getByText(
        "The double-opt-in link hasn't been clicked yet. Resend it if it never arrived.",
      ),
    ).toBeVisible();
    expect(
      screen.getByTestId('newsletter-subscription-control'),
    ).toHaveTextContent('resend');
  });
});
