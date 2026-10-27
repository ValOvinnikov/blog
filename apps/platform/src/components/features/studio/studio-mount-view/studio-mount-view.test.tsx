import {
  CAPABILITY,
  LOCALE_ISO_CODES,
  SANITY_LOGIN_PROVIDER,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';
import {
  mockReadyTenant,
  MOCK_ARCHIVED_AT,
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { StudioMountView } from './studio-mount-view';

faker.seed(5994);

const STUDIO_MOUNT = 'studio-mount';
const MOCK_READ_TOKEN = faker.string.alphanumeric(24);
const MOCK_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_DATASET = faker.lorem.word();

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

const mockProvisionedTenant = (
  overrides: Parameters<typeof mockReadyTenant>[0] = {},
) =>
  mockReadyTenant({
    sanityReadTokenEncrypted: MOCK_READ_TOKEN,
    ...overrides,
  });

const MOCK_TENANT = mockProvisionedTenant();

const setup = customRenderAsync(StudioMountView, {
  tenant: MOCK_TENANT,
  basePath: adminRoutes.dashboardStudio(),
});

describe(`<${StudioMountView.name}/>`, () => {
  beforeEach(() => {
    getEnabledCapabilitiesMock.mockReset().mockResolvedValue([]);
    selectLiveLocalesMock.mockReset().mockReturnValue([LOCALE_ISO_CODES.EN]);
  });

  it('shows the archived notice instead of Studio for a deprovisioned tenant', async () => {
    await setup({
      tenant: mockProvisionedTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
    });

    const studioHeading = screen.getByRole('heading', {
      level: 1,
      name: 'Studio',
    });
    const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);
    const studioMount = screen.queryByTestId(STUDIO_MOUNT);

    expect(studioHeading).toBeVisible();
    expect(archivedNotice).toBeVisible();
    expect(getEnabledCapabilitiesMock).not.toHaveBeenCalled();
    expect(studioMount).not.toBeInTheDocument();
  });

  it.each([
    'sanityProjectId',
    'sanityDataset',
    'sanityReadTokenEncrypted',
  ] as const)(
    'shows a not-ready alert when the tenant has no %s',
    async (field) => {
      await setup({ tenant: mockProvisionedTenant({ [field]: null }) });

      const studioHeading = screen.getByRole('heading', {
        level: 1,
        name: 'Studio',
      });
      const notReadyAlert = screen.getByText("Studio isn't ready yet");
      const studioMount = screen.queryByTestId(STUDIO_MOUNT);

      expect(studioHeading).toBeVisible();
      expect(notReadyAlert).toBeVisible();
      expect(getEnabledCapabilitiesMock).not.toHaveBeenCalled();
      expect(studioMount).not.toBeInTheDocument();
    },
  );

  it("mounts Studio with the tenant's project, dataset and base path", async () => {
    const tenant = mockProvisionedTenant({
      id: MOCK_OTHER_TENANT_ID,
      name: MOCK_OTHER_TENANT_NAME,
      sanityProjectId: MOCK_PROJECT_ID,
      sanityDataset: MOCK_DATASET,
    });
    const basePath = adminRoutes.tenantStudio(MOCK_OTHER_TENANT_ID);

    await setup({ tenant, basePath });

    const studioMount = screen.getByTestId(STUDIO_MOUNT);

    expect(studioMount).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith({
      projectId: MOCK_PROJECT_ID,
      dataset: MOCK_DATASET,
      basePath,
      title: MOCK_OTHER_TENANT_NAME,
      enabledCapabilities: [],
      defaultLocale: tenant.locale,
      liveLocales: [LOCALE_ISO_CODES.EN],
    });
  });

  it("passes the tenant's effective capabilities to Studio", async () => {
    getEnabledCapabilitiesMock.mockResolvedValue([CAPABILITY.COMMENTS]);

    await setup();

    expect(getEnabledCapabilitiesMock).toHaveBeenCalledWith(MOCK_TENANT);
    expect(studioMountMock).toHaveBeenCalledWith({
      projectId: MOCK_TENANT.sanityProjectId,
      dataset: MOCK_TENANT.sanityDataset,
      basePath: adminRoutes.dashboardStudio(),
      title: MOCK_TENANT.name,
      enabledCapabilities: [CAPABILITY.COMMENTS],
      defaultLocale: MOCK_TENANT.locale,
      liveLocales: [LOCALE_ISO_CODES.EN],
    });
  });

  it("passes the tenant's default and live languages to Studio", async () => {
    const tenant = mockProvisionedTenant({ locale: LOCALE_ISO_CODES.NL });
    const liveLocales = [LOCALE_ISO_CODES.NL, LOCALE_ISO_CODES.EN];
    selectLiveLocalesMock.mockReturnValue(liveLocales);

    await setup({ tenant });

    expect(selectLiveLocalesMock).toHaveBeenCalledWith(tenant);
    expect(studioMountMock).toHaveBeenCalledWith({
      projectId: tenant.sanityProjectId,
      dataset: tenant.sanityDataset,
      basePath: adminRoutes.dashboardStudio(),
      title: tenant.name,
      enabledCapabilities: [],
      defaultLocale: LOCALE_ISO_CODES.NL,
      liveLocales,
    });
  });

  it('restricts Studio to the given login provider', async () => {
    await setup({ loginProvider: SANITY_LOGIN_PROVIDER.GITHUB });

    expect(studioMountMock).toHaveBeenCalledWith({
      projectId: MOCK_TENANT.sanityProjectId,
      dataset: MOCK_TENANT.sanityDataset,
      basePath: adminRoutes.dashboardStudio(),
      title: MOCK_TENANT.name,
      enabledCapabilities: [],
      defaultLocale: MOCK_TENANT.locale,
      liveLocales: [LOCALE_ISO_CODES.EN],
      loginProvider: SANITY_LOGIN_PROVIDER.GITHUB,
    });
  });
});
