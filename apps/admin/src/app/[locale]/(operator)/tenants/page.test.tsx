import {
  customRenderAsync,
  screen,
  within,
} from '@admin/testing/custom-render';
import { mockDbConstants } from '@admin/testing/mock-db-constants';

import TenantsPage from './page';

const { listTenantsMock } = vi.hoisted(() => ({
  listTenantsMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { tenants: { listTenants: listTenantsMock } },
}));

const setup = customRenderAsync(TenantsPage, {
  searchParams: Promise.resolve({}),
});

describe(TenantsPage, () => {
  beforeEach(() => {
    listTenantsMock.mockReset();
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
});
