import {
  customRenderAsync,
  screen,
  within,
} from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';

import TenantsPage from './page';

const { listTenantsMock, envMock } = vi.hoisted(() => ({
  listTenantsMock: vi.fn(),
  envMock: { RESEND_API_KEY: undefined as string | undefined },
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { tenants: { listTenants: listTenantsMock } },
}));

vi.mock('@platform/utils/env/env', () => ({ env: envMock }));

const setup = customRenderAsync(TenantsPage, {
  searchParams: Promise.resolve({}),
});

describe(TenantsPage, () => {
  beforeEach(() => {
    listTenantsMock.mockReset();
    envMock.RESEND_API_KEY = 'resend-key';
  });

  it('renders the real tenant rows from listTenants, excluding archived by default', async () => {
    listTenantsMock.mockResolvedValue([
      {
        id: 'tenant-1',
        slug: 'acme',
        name: 'Acme Inc.',
        primaryDomain: 'acme.example.com',
        sanityProjectId: 'proj-1',
        sanityDataset: 'production',
        locale: 'en',
        plan: 'FREE',
        status: 'ACTIVE',
        createdAt: new Date('2026-04-02T00:00:00.000Z'),
        updatedAt: new Date('2026-04-02T00:00:00.000Z'),
      },
    ]);

    await setup();

    expect(listTenantsMock).toHaveBeenCalledWith({ includeArchived: false });
    expect(screen.getByText('Acme Inc.')).toBeVisible();
    expect(within(screen.getByRole('table')).getByText('Active')).toBeVisible();
  });

  it('includes archived tenants when ?archived=1 is set', async () => {
    listTenantsMock.mockResolvedValue([]);

    await setup({ searchParams: Promise.resolve({ archived: '1' }) });

    expect(listTenantsMock).toHaveBeenCalledWith({ includeArchived: true });
  });

  it('does not show the email-alerts banner when RESEND_API_KEY is configured', async () => {
    listTenantsMock.mockResolvedValue([]);

    await setup();

    expect(
      screen.queryByText('Email alerts not configured'),
    ).not.toBeInTheDocument();
  });

  it('shows the email-alerts banner when RESEND_API_KEY is unset', async () => {
    envMock.RESEND_API_KEY = undefined;
    listTenantsMock.mockResolvedValue([]);

    await setup();

    expect(screen.getByText('Email alerts not configured')).toBeVisible();
  });
});
