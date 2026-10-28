import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  MOCK_SANITY_PROJECT_ID,
} from '@platform/testing/tenants/fixtures';
import {
  MOCK_FREE_STUDIO_ENTITLEMENTS,
  mockStudioReadyTenant,
} from '@platform/testing/tenants/studio-ready-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';

import TenantStudioPage from './page';

const {
  getAdminByUserIdMock,
  getTenantByIdMock,
  studioMountMock,
  STUDIO_MOUNT_TEST_ID,
} = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  studioMountMock: vi.fn(),
  STUDIO_MOUNT_TEST_ID: 'studio-mount',
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/settings-features/get-enabled-capabilities');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: {
      getTenantById: getTenantByIdMock,
      selectLiveLocales: vi.fn(() => []),
    },
  },
}));

vi.mock('@blog/studio', () => ({
  StudioMount: (props: unknown) => {
    studioMountMock(props);
    return <div data-testid={STUDIO_MOUNT_TEST_ID} />;
  },
}));

const tenant = mockStudioReadyTenant({
  id: MOCK_OTHER_TENANT_ID,
  name: MOCK_OTHER_TENANT_NAME,
});

const setup = customRenderAsync(TenantStudioPage, {
  params: Promise.resolve({ tenantId: MOCK_OTHER_TENANT_ID }),
});

describe(`<${TenantStudioPage.name}/>`, () => {
  beforeEach(() => {
    getAdminByUserIdMock.mockResolvedValue(mockAdmin());
    getTenantByIdMock.mockResolvedValue(tenant);
  });

  it('404s a signed-in user who is not an operator', async () => {
    getAdminByUserIdMock.mockResolvedValueOnce(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(studioMountMock).not.toHaveBeenCalled();
  });

  it("mounts Studio for the routed tenant under that tenant's Studio path", async () => {
    await setup();

    const studioMount = screen.getByTestId(STUDIO_MOUNT_TEST_ID);

    expect(studioMount).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith({
      projectId: MOCK_SANITY_PROJECT_ID,
      dataset: tenant.sanityDataset,
      basePath: adminRoutes.tenantStudio(MOCK_OTHER_TENANT_ID),
      title: MOCK_OTHER_TENANT_NAME,
      enabledCapabilities: [],
      entitlements: MOCK_FREE_STUDIO_ENTITLEMENTS,
      defaultLocale: tenant.locale,
      liveLocales: [],
      loginProvider: undefined,
    });
  });
});
