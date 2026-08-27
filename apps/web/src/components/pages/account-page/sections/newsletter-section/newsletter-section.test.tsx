import { customRenderAsync, screen } from '@web/testing/custom-render';

import { NewsletterSection } from './newsletter-section';

const {
  authMock,
  getSubscriptionStatusMock,
  getChromeOnMock,
  getRequestTenantIdMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getSubscriptionStatusMock: vi.fn(),
  getChromeOnMock: vi.fn(),
  getRequestTenantIdMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: getRequestTenantIdMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    subscribers: { getSubscriptionStatus: getSubscriptionStatusMock },
  },
}));

vi.mock('@web/utils/get-chrome-on', () => ({
  getChromeOn: getChromeOnMock,
}));

vi.mock('@web/components/shared/newsletter-subscription-control', () => ({
  NewsletterSubscriptionControl: ({ action }: { action: string }) => (
    <div data-testid="newsletter-subscription-control">{action}</div>
  ),
}));

const setup = customRenderAsync(NewsletterSection, {});

const TENANT_ID = 'tenant-1';

const authedSession = {
  user: { id: 'user-1', name: 'Jane Doe', email: 'jane@icloud.com' },
};

describe(`<${NewsletterSection.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getSubscriptionStatusMock.mockReset();
    getChromeOnMock.mockReset();
    getChromeOnMock.mockResolvedValue(true);
    getRequestTenantIdMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(TENANT_ID);
  });

  it('renders nothing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(getSubscriptionStatusMock).not.toHaveBeenCalled();
  });

  it('renders nothing when no tenant resolves', async () => {
    authMock.mockResolvedValue(authedSession);
    getRequestTenantIdMock.mockResolvedValue(undefined);

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

  it('queries the subscription status for the tenant and user, then renders the active state with an unsubscribe control', async () => {
    authMock.mockResolvedValue(authedSession);
    getSubscriptionStatusMock.mockResolvedValue({
      outcome: 'active',
      subscriber: { email: 'jane@icloud.com' },
    });

    await setup();

    expect(getSubscriptionStatusMock).toHaveBeenCalledWith(TENANT_ID, 'user-1');
    expect(screen.getByText('Subscribed')).toBeVisible();
    expect(screen.getByText('jane@icloud.com')).toBeVisible();
    expect(
      screen.getByTestId('newsletter-subscription-control'),
    ).toHaveTextContent('unsubscribe');
  });

  it('passes a resend control action for the pending outcome', async () => {
    authMock.mockResolvedValue(authedSession);
    getSubscriptionStatusMock.mockResolvedValue({
      outcome: 'pending',
      subscriber: { email: 'jane@icloud.com' },
    });

    await setup();

    expect(
      screen.getByTestId('newsletter-subscription-control'),
    ).toHaveTextContent('resend');
  });
});
