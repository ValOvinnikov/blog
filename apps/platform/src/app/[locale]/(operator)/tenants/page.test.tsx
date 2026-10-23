import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import {
  customRenderAsync,
  screen,
  within,
} from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_TENANT_NAME,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';

import TenantsPage from './page';

const { listTenantsMock } = vi.hoisted(() => ({
  listTenantsMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { tenants: { listTenants: listTenantsMock } },
}));

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

const setup = customRenderAsync(TenantsPage, {
  searchParams: Promise.resolve({}),
});

const AT_20260402_0000 = '2026-04-02T00:00:00.000Z';
const EMAIL_ALERTS_NOT_CONFIGURED = 'Email alerts not configured';

describe(TenantsPage, () => {
  beforeEach(() => {
    listTenantsMock.mockReset();
    envMock.RESEND_API_KEY = 'resend-key';
    listTenantsMock.mockResolvedValue([]);
  });

  it('renders the real tenant rows from listTenants, excluding archived by default', async () => {
    listTenantsMock.mockResolvedValue([
      {
        id: TENANT_ID,
        name: MOCK_TENANT_NAME,
        primaryDomain: 'acme.example.com',
        sanityProjectId: 'proj-1',
        sanityDataset: 'production',
        locale: 'en',
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
        createdAt: new Date(AT_20260402_0000),
        updatedAt: new Date(AT_20260402_0000),
      },
    ]);

    await setup();

    const tenantName = screen.getByText(MOCK_TENANT_NAME);
    const table = screen.getByRole('table');
    const activeStatus = within(table).getByText('Active');

    expect(listTenantsMock).toHaveBeenCalledWith({ includeArchived: false });
    expect(tenantName).toBeVisible();
    expect(activeStatus).toBeVisible();
  });

  it('includes archived tenants when ?archived=1 is set', async () => {
    await setup({ searchParams: Promise.resolve({ archived: '1' }) });

    expect(listTenantsMock).toHaveBeenCalledWith({ includeArchived: true });
  });

  it('does not show the email-alerts banner when RESEND_API_KEY is configured', async () => {
    await setup();

    const banner = screen.queryByText(EMAIL_ALERTS_NOT_CONFIGURED);

    expect(banner).not.toBeInTheDocument();
  });

  it('shows the email-alerts banner when RESEND_API_KEY is unset', async () => {
    envMock.RESEND_API_KEY = undefined;

    await setup();

    const banner = screen.getByText(EMAIL_ALERTS_NOT_CONFIGURED);

    expect(banner).toBeVisible();
  });
});
