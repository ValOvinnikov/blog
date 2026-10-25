import { queries } from '@blog/db';
import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import { ToastProvider } from '@web/context/toast-provider';
import { auth } from '@web/server/auth/auth';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { MOCK_ACCOUNT_USER } from '@web/testing/pages/account-page/session-user-fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

import { NewsletterSection } from './newsletter-section';

vi.mock('@web/server/auth/auth', () => ({ auth: vi.fn() }));

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/db', () => ({
  queries: { subscribers: { getSubscriptionStatus: vi.fn() } },
}));

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
      user: MOCK_ACCOUNT_USER,
    });
  });

  it('renders nothing when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await setup();

    const newsletterHeading = screen.queryByRole('heading', {
      name: 'Newsletter',
    });

    expect(newsletterHeading).not.toBeInTheDocument();
    expect(getSubscriptionStatusMock).not.toHaveBeenCalled();
  });

  it('renders nothing when no tenant resolves', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      tenantId: undefined,
    });

    await setup();

    const newsletterHeading = screen.queryByRole('heading', {
      name: 'Newsletter',
    });

    expect(newsletterHeading).not.toBeInTheDocument();
    expect(getSubscriptionStatusMock).not.toHaveBeenCalled();
  });

  it('renders nothing when the account is not subscribed', async () => {
    getSubscriptionStatusMock.mockResolvedValue({ outcome: 'not-subscribed' });

    await setup();

    const newsletterHeading = screen.queryByRole('heading', {
      name: 'Newsletter',
    });

    expect(newsletterHeading).not.toBeInTheDocument();
  });

  it('shows the active subscription with an unsubscribe button', async () => {
    getSubscriptionStatusMock.mockResolvedValue({
      outcome: SUBSCRIBER_STATUS.ACTIVE,
      subscriber: { email: MOCK_ACCOUNT_USER.email },
    } as Awaited<ReturnType<typeof getSubscriptionStatusMock>>);

    await setup();

    const subscribedText = screen.getByText('Subscribed');
    const userEmailText = screen.getByText(MOCK_ACCOUNT_USER.email);
    const unsubscribeButton = screen.getByRole('button', {
      name: 'Unsubscribe',
    });

    expect(getSubscriptionStatusMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_ACCOUNT_USER.id,
    );
    expect(subscribedText).toBeVisible();
    expect(userEmailText).toBeVisible();
    expect(unsubscribeButton).toBeVisible();
  });

  it('offers to resend the confirmation for a pending subscription', async () => {
    getSubscriptionStatusMock.mockResolvedValue({
      outcome: SUBSCRIBER_STATUS.PENDING,
      subscriber: { email: MOCK_ACCOUNT_USER.email },
    } as Awaited<ReturnType<typeof getSubscriptionStatusMock>>);

    await setup();

    const pendingConfirmationText = screen.getByText('Pending confirmation');
    const resendConfirmationButton = screen.getByRole('button', {
      name: 'Resend confirmation',
    });

    expect(pendingConfirmationText).toBeVisible();
    expect(resendConfirmationButton).toBeVisible();
  });
});
