import { queries } from '@blog/db';
import { ToastProvider } from '@web/context/toast-provider';
import { auth } from '@web/server/auth/auth';
import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderServerAsync, screen } from '@web/testing/custom-render';
import { ACCOUNT_USER } from '@web/testing/pages/account-page/session-user-fixtures';
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

const SECTION_HEADING = 'Newsletter';

const setup = customRenderServerAsync(
  NewsletterSection,
  {},
  { wrapper: ToastProvider },
);

describe(`<${NewsletterSection.name}/>`, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: ACCOUNT_USER,
    });
  });

  it.each([
    [
      'there is no session',
      () => {
        authMock.mockResolvedValue(null);
      },
    ],
    [
      'no tenant resolves',
      () => {
        vi.mocked(getRequestContext).mockResolvedValueOnce({
          ...MOCK_REQUEST_CONTEXT,
          tenantId: undefined,
        });
      },
    ],
  ])('renders nothing and skips the lookup when %s', async (_case, arrange) => {
    arrange();

    await setup();

    const heading = screen.queryByRole('heading', { name: SECTION_HEADING });
    expect(heading).not.toBeInTheDocument();
    expect(getSubscriptionStatusMock).not.toHaveBeenCalled();
  });

  it('renders nothing when the account is not subscribed', async () => {
    getSubscriptionStatusMock.mockResolvedValue({ outcome: 'not-subscribed' });

    await setup();

    const heading = screen.queryByRole('heading', { name: SECTION_HEADING });
    expect(heading).not.toBeInTheDocument();
  });

  it('shows the active subscription with an unsubscribe button', async () => {
    getSubscriptionStatusMock.mockResolvedValue({
      outcome: 'active',
      subscriber: { email: ACCOUNT_USER.email },
    } as Awaited<ReturnType<typeof getSubscriptionStatusMock>>);

    await setup();

    expect(getSubscriptionStatusMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      ACCOUNT_USER.id,
    );
    const status = screen.getByText('Subscribed');
    const email = screen.getByText(ACCOUNT_USER.email);
    const unsubscribeButton = screen.getByRole('button', {
      name: 'Unsubscribe',
    });
    expect(status).toBeVisible();
    expect(email).toBeVisible();
    expect(unsubscribeButton).toBeVisible();
  });

  it('offers to resend the confirmation for a pending subscription', async () => {
    getSubscriptionStatusMock.mockResolvedValue({
      outcome: 'pending',
      subscriber: { email: ACCOUNT_USER.email },
    } as Awaited<ReturnType<typeof getSubscriptionStatusMock>>);

    await setup();

    const status = screen.getByText('Pending confirmation');
    const resendButton = screen.getByRole('button', {
      name: 'Resend confirmation',
    });
    expect(status).toBeVisible();
    expect(resendButton).toBeVisible();
  });
});
