import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OTHER_TENANT_NAME,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import type { Session } from 'next-auth';

import TenantStudioPage from './page';

const { getAdminByUserIdMock, getTenantByIdMock, studioMountMock } = vi.hoisted(
  () => ({
    getAdminByUserIdMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
    studioMountMock: vi.fn(),
  }),
);

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/settings-features/get-enabled-capabilities');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: {
      getTenantById: getTenantByIdMock,
      selectLiveLocales: vi.fn().mockReturnValue([]),
    },
  },
}));

vi.mock('@blog/studio', () => ({
  StudioMount: (props: unknown) => {
    studioMountMock(props);
    return <div data-testid="studio-mount" />;
  },
}));

const GLOBEX_PROJECT_ID = 'proj-globex';

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const setup = customRenderAsync(TenantStudioPage, {
  params: Promise.resolve({ tenantId: 'tenant-2' }),
});

describe(`<${TenantStudioPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      role: ADMIN_ROLE.ADMIN,
    });
    getTenantByIdMock.mockReset();
  });

  it('redirects to sign-in when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
  });

  it('404s a signed-in tenant owner with no admins row, even calling the page directly', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  it('404s for an unknown tenant id', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  it("mounts Studio with the routed tenant's coordinates and a tenant-keyed basePath", async () => {
    getTenantByIdMock.mockResolvedValue(
      mockTenant({
        id: 'tenant-2',
        name: MOCK_OTHER_TENANT_NAME,
        sanityProjectId: GLOBEX_PROJECT_ID,
        sanityDataset: 'production',
        sanityReadTokenEncrypted: 'encrypted-token',
        deprovisionedAt: null,
      }),
    );

    await setup();

    expect(screen.getByTestId('studio-mount')).toBeVisible();
    expect(studioMountMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: GLOBEX_PROJECT_ID,
        dataset: 'production',
        basePath: '/tenants/tenant-2/studio',
        title: MOCK_OTHER_TENANT_NAME,
      }),
    );
  });
});
