import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import { StudioMountView } from './studio-mount-view';

const { getTenantSanityCredentialsMock, studioMountMock } = vi.hoisted(() => ({
  getTenantSanityCredentialsMock: vi.fn(),
  studioMountMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantSanityCredentials: getTenantSanityCredentialsMock },
  },
}));

vi.mock('@blog/studio', () => ({
  StudioMount: (props: unknown) => {
    studioMountMock(props);
    return <div data-testid="studio-mount" />;
  },
}));

describe(StudioMountView, () => {
  beforeEach(() => {
    getTenantSanityCredentialsMock.mockReset();
    studioMountMock.mockReset();
  });

  it('shows the archived notice instead of mounting Studio for a deprovisioned tenant, without checking credentials', async () => {
    const tenant = makeTenant({
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });

    renderWithIntl(
      await StudioMountView({ tenant, basePath: '/dashboard/studio' }),
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Studio' }),
    ).toBeVisible();
    expect(screen.getByText('This tenant is archived')).toBeVisible();
    expect(getTenantSanityCredentialsMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('studio-mount')).not.toBeInTheDocument();
  });

  it("shows a not-ready alert instead of mounting Studio when the tenant's Sanity project isn't provisioned", async () => {
    const tenant = makeTenant();
    getTenantSanityCredentialsMock.mockResolvedValue(undefined);

    renderWithIntl(
      await StudioMountView({ tenant, basePath: '/dashboard/studio' }),
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Studio' }),
    ).toBeVisible();
    expect(screen.getByText("Studio isn't ready yet")).toBeVisible();
    expect(screen.queryByTestId('studio-mount')).not.toBeInTheDocument();
  });

  it('mounts Studio with the resolved credentials and the given basePath', async () => {
    const tenant = makeTenant({ id: 'tenant-2', name: 'Globex Corp.' });
    getTenantSanityCredentialsMock.mockResolvedValue({
      projectId: 'proj-globex',
      dataset: 'production',
      token: 'secret-token',
    });

    renderWithIntl(
      await StudioMountView({
        tenant,
        basePath: '/tenants/tenant-2/studio',
      }),
    );

    expect(getTenantSanityCredentialsMock).toHaveBeenCalledWith('tenant-2');
    expect(screen.getByTestId('studio-mount')).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-globex',
        dataset: 'production',
        basePath: '/tenants/tenant-2/studio',
        title: 'Globex Corp.',
      }),
    );
  });
});
