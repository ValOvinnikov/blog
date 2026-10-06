import { queries } from '@blog/db';
import { ToastProvider } from '@web/context/toast-provider';
import { auth } from '@web/server/auth/auth';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

import { NewsletterSection } from './newsletter-section';

vi.mock('@web/server/auth/auth', () => ({ auth: vi.fn() }));

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/db', () => ({
  queries: { subscribers: { getSubscriptionStatus: vi.fn() } },
}));

vi.mock('@web/utils/logger/logger');

const authMock = vi.mocked(auth as () => Promise<unknown>);
const getSubscriptionStatusMock = vi.mocked(
  queries.subscribers.getSubscriptionStatus,
);

const setup = customRenderServerAsync(
  NewsletterSection,
  {},
  { wrapper: ToastProvider },
);

describe(`<${NewsletterSection.name}/>`, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Jane Doe', email: 'jane@icloud.com' },
    });
  });

  it('renders nothing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await setup();

    expect(
      screen.queryByRole('heading', { name: 'Newsletter' }),
    ).not.toBeInTheDocument();
    expect(getSubscriptionStatusMock).not.toHaveBeenCalled();
  });

  it('renders nothing when no tenant resolves', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...DEFAULT_REQUEST_CONTEXT,
      tenantId: undefined,
    });

    await setup();

    expect(
      screen.queryByRole('heading', { name: 'Newsletter' }),
    ).not.toBeInTheDocument();
    expect(getSubscriptionStatusMock).not.toHaveBeenCalled();
  });

  it('renders nothing when the account is not subscribed', async () => {
    getSubscriptionStatusMock.mockResolvedValue({ outcome: 'not-subscribed' });

    await setup();

    expect(
      screen.queryByRole('heading', { name: 'Newsletter' }),
    ).not.toBeInTheDocument();
  });

  it('shows the active subscription with an unsubscribe button', async () => {
    getSubscriptionStatusMock.mockResolvedValue({
      outcome: 'active',
      subscriber: { email: 'jane@icloud.com' },
    } as Awaited<ReturnType<typeof getSubscriptionStatusMock>>);

    await setup();

    expect(getSubscriptionStatusMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      'user-1',
    );
    expect(screen.getByText('Subscribed')).toBeVisible();
    expect(screen.getByText('jane@icloud.com')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Unsubscribe' })).toBeVisible();
  });

  it('offers to resend the confirmation for a pending subscription', async () => {
    getSubscriptionStatusMock.mockResolvedValue({
      outcome: 'pending',
      subscriber: { email: 'jane@icloud.com' },
    } as Awaited<ReturnType<typeof getSubscriptionStatusMock>>);

    await setup();

    expect(screen.getByText('Pending confirmation')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Resend confirmation' }),
    ).toBeVisible();
  });
});
