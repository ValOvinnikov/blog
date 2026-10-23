import {
  CAPABILITY,
  LOCALE_ISO_CODES,
  SANITY_LOGIN_PROVIDER,
} from '@blog/config';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';
import {
  makeReadyTenant,
  MOCK_ARCHIVED_AT,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { StudioMountView } from './studio-mount-view';

const STUDIO_MOUNT = 'studio-mount';
const PROJ_GLOBEX = 'proj-globex';

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
    return <div data-testid={STUDIO_MOUNT} />;
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
      deprovisionedAt: MOCK_ARCHIVED_AT,
    });

    renderWithIntl(
      await StudioMountView({
        tenant,
        basePath: adminRoutes.dashboardStudio(),
      }),
    );

    const studioHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Studio',
    });
    const thisTenantIsText = screen.getByText(ARCHIVED_NOTICE_TEXT);
    const studioMount = screen.queryByTestId(STUDIO_MOUNT);

    expect(studioHeading).toBeVisible();
    expect(thisTenantIsText).toBeVisible();
    expect(getEnabledCapabilitiesMock).not.toHaveBeenCalled();
    expect(studioMount).not.toBeInTheDocument();
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
        await StudioMountView({
          tenant,
          basePath: adminRoutes.dashboardStudio(),
        }),
      );

      const studioHeading = screen.getByRole('heading', {
        level: 1,
        name: 'Studio',
      });
      const studioIsNotText = screen.getByText("Studio isn't ready yet");
      const studioMount = screen.queryByTestId(STUDIO_MOUNT);

      expect(studioHeading).toBeVisible();
      expect(studioIsNotText).toBeVisible();
      expect(getEnabledCapabilitiesMock).not.toHaveBeenCalled();
      expect(studioMount).not.toBeInTheDocument();
    },
  );

  it("mounts Studio with the tenant's project and dataset and the given basePath", async () => {
    const tenant = makeProvisionedTenant({
      id: MOCK_OTHER_TENANT_ID,
      name: MOCK_OTHER_TENANT_NAME,
      sanityProjectId: PROJ_GLOBEX,
      sanityDataset: 'staging',
    });

    renderWithIntl(
      await StudioMountView({
        tenant,
        basePath: adminRoutes.tenantStudio(MOCK_OTHER_TENANT_ID),
      }),
    );

    const studioMount = screen.getByTestId(STUDIO_MOUNT);

    expect(studioMount).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith({
      projectId: PROJ_GLOBEX,
      dataset: 'staging',
      basePath: adminRoutes.tenantStudio(MOCK_OTHER_TENANT_ID),
      title: MOCK_OTHER_TENANT_NAME,
      enabledCapabilities: [],
      defaultLocale: tenant.locale,
      liveLocales: [LOCALE_ISO_CODES.EN],
      loginProvider: undefined,
    });
  });

  it("passes the tenant's effective capabilities to Studio", async () => {
    const tenant = makeProvisionedTenant();
    getEnabledCapabilitiesMock.mockResolvedValue([CAPABILITY.COMMENTS]);

    renderWithIntl(
      await StudioMountView({
        tenant,
        basePath: adminRoutes.dashboardStudio(),
      }),
    );

    expect(getEnabledCapabilitiesMock).toHaveBeenCalledWith(tenant);
    expect(studioMountMock).toHaveBeenCalledWith({
      projectId: tenant.sanityProjectId,
      dataset: tenant.sanityDataset,
      basePath: adminRoutes.dashboardStudio(),
      title: tenant.name,
      enabledCapabilities: [CAPABILITY.COMMENTS],
      defaultLocale: tenant.locale,
      liveLocales: [LOCALE_ISO_CODES.EN],
      loginProvider: undefined,
    });
  });

  it("passes the tenant's default and live languages to Studio", async () => {
    const tenant = makeProvisionedTenant({ locale: LOCALE_ISO_CODES.NL });
    selectLiveLocalesMock.mockReturnValue([
      LOCALE_ISO_CODES.NL,
      LOCALE_ISO_CODES.EN,
    ]);

    renderWithIntl(
      await StudioMountView({
        tenant,
        basePath: adminRoutes.dashboardStudio(),
      }),
    );

    expect(selectLiveLocalesMock).toHaveBeenCalledWith(tenant);
    expect(studioMountMock).toHaveBeenCalledWith({
      projectId: tenant.sanityProjectId,
      dataset: tenant.sanityDataset,
      basePath: adminRoutes.dashboardStudio(),
      title: tenant.name,
      enabledCapabilities: [],
      defaultLocale: LOCALE_ISO_CODES.NL,
      liveLocales: [LOCALE_ISO_CODES.NL, LOCALE_ISO_CODES.EN],
      loginProvider: undefined,
    });
  });

  it('restricts Studio to the given login provider', async () => {
    const tenant = makeProvisionedTenant();

    renderWithIntl(
      await StudioMountView({
        tenant,
        basePath: adminRoutes.dashboardStudio(),
        loginProvider: SANITY_LOGIN_PROVIDER.GITHUB,
      }),
    );

    expect(studioMountMock).toHaveBeenCalledWith({
      projectId: tenant.sanityProjectId,
      dataset: tenant.sanityDataset,
      basePath: adminRoutes.dashboardStudio(),
      title: tenant.name,
      enabledCapabilities: [],
      defaultLocale: tenant.locale,
      liveLocales: [LOCALE_ISO_CODES.EN],
      loginProvider: SANITY_LOGIN_PROVIDER.GITHUB,
    });
  });
});
