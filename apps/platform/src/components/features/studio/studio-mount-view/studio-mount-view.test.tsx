import { CAPABILITY, LOCALE_ISO_CODES } from '@blog/config';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { makeReadyTenant } from '@platform/testing/tenants/fixtures';

import { StudioMountView } from './studio-mount-view';

const { studioMountMock, getEnabledCapabilitiesMock, selectLiveLocalesMock } =
  vi.hoisted(() => ({
    selectLiveLocalesMock: vi.fn(),
    getEnabledCapabilitiesMock: vi.fn(),
    studioMountMock: vi.fn(),
  }));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { selectLiveLocales: selectLiveLocalesMock },
  },
}));

vi.mock('@platform/server/settings-features/get-enabled-capabilities', () => ({
  getEnabledCapabilities: getEnabledCapabilitiesMock,
}));

vi.mock('@blog/studio', () => ({
  StudioMount: (props: unknown) => {
    studioMountMock(props);
    return <div data-testid="studio-mount" />;
  },
}));

const makeProvisionedTenant = (
  overrides: Parameters<typeof makeReadyTenant>[0] = {},
) =>
  makeReadyTenant({
    sanityReadTokenEncrypted: 'encrypted-token',
    ...overrides,
  });

describe(`<${StudioMountView.name}/>`, () => {
  beforeEach(() => {
    studioMountMock.mockReset();
    getEnabledCapabilitiesMock.mockReset();
    getEnabledCapabilitiesMock.mockResolvedValue([]);
    selectLiveLocalesMock.mockReset();
    selectLiveLocalesMock.mockReturnValue([LOCALE_ISO_CODES.EN]);
  });

  it('shows the archived notice instead of mounting Studio for a deprovisioned tenant', async () => {
    const tenant = makeProvisionedTenant({
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });

    renderWithIntl(
      await StudioMountView({ tenant, basePath: '/dashboard/studio' }),
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Studio' }),
    ).toBeVisible();
    expect(screen.getByText('This tenant is archived')).toBeVisible();
    expect(getEnabledCapabilitiesMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('studio-mount')).not.toBeInTheDocument();
  });

  it.each([
    'sanityProjectId',
    'sanityDataset',
    'sanityReadTokenEncrypted',
  ] as const)(
    'shows a not-ready alert instead of mounting Studio when the tenant has no %s',
    async (field) => {
      const tenant = makeProvisionedTenant({ [field]: null });

      renderWithIntl(
        await StudioMountView({ tenant, basePath: '/dashboard/studio' }),
      );

      expect(
        screen.getByRole('heading', { level: 1, name: 'Studio' }),
      ).toBeVisible();
      expect(screen.getByText("Studio isn't ready yet")).toBeVisible();
      expect(getEnabledCapabilitiesMock).not.toHaveBeenCalled();
      expect(screen.queryByTestId('studio-mount')).not.toBeInTheDocument();
    },
  );

  it("mounts Studio with the tenant's project and dataset and the given basePath", async () => {
    const tenant = makeProvisionedTenant({
      id: 'tenant-2',
      name: 'Globex Corp.',
      sanityProjectId: 'proj-globex',
      sanityDataset: 'staging',
    });

    renderWithIntl(
      await StudioMountView({
        tenant,
        basePath: '/tenants/tenant-2/studio',
      }),
    );

    expect(screen.getByTestId('studio-mount')).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'proj-globex',
        dataset: 'staging',
        basePath: '/tenants/tenant-2/studio',
        title: 'Globex Corp.',
      }),
    );
  });

  it("passes the tenant's effective capabilities to Studio", async () => {
    const tenant = makeProvisionedTenant();
    getEnabledCapabilitiesMock.mockResolvedValue([CAPABILITY.COMMENTS]);

    renderWithIntl(
      await StudioMountView({ tenant, basePath: '/dashboard/studio' }),
    );

    expect(getEnabledCapabilitiesMock).toHaveBeenCalledWith(tenant);
    expect(studioMountMock).toHaveBeenCalledWith(
      expect.objectContaining({ enabledCapabilities: [CAPABILITY.COMMENTS] }),
    );
  });

  it("passes the tenant's default and live languages to Studio", async () => {
    const tenant = makeProvisionedTenant({ locale: LOCALE_ISO_CODES.NL });
    selectLiveLocalesMock.mockReturnValue([
      LOCALE_ISO_CODES.NL,
      LOCALE_ISO_CODES.EN,
    ]);

    renderWithIntl(
      await StudioMountView({ tenant, basePath: '/dashboard/studio' }),
    );

    expect(selectLiveLocalesMock).toHaveBeenCalledWith(tenant);
    expect(studioMountMock).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultLocale: LOCALE_ISO_CODES.NL,
        liveLocales: [LOCALE_ISO_CODES.NL, LOCALE_ISO_CODES.EN],
      }),
    );
  });
});
