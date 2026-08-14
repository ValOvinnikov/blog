import { customRenderAsync, screen } from '@admin/testing/custom-render';

import TenantsPage from './page';

const { listTenantsMock } = vi.hoisted(() => ({
  listTenantsMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { listTenants: listTenantsMock } },
}));

const setup = customRenderAsync(TenantsPage, {});

describe(TenantsPage, () => {
  beforeEach(() => {
    listTenantsMock.mockReset();
  });

  it('renders the real tenant rows from listTenants', async () => {
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

    expect(listTenantsMock).toHaveBeenCalled();
    expect(screen.getByText('Acme Inc.')).toBeVisible();
    expect(screen.getByText('Active')).toBeVisible();
  });
});
