import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockTenant, MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import TenantSignInAppsPage from './page';

const { getAdminByUserIdMock, getTenantByIdMock, listTenantOAuthClientsMock } =
  vi.hoisted(() => ({
    getAdminByUserIdMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
    listTenantOAuthClientsMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
    tenantOAuthCredentials: {
      listTenantOAuthClients: listTenantOAuthClientsMock,
    },
  },
}));

const t = makeEnTranslator('signInAppsPage');

const setup = customRenderAsync(TenantSignInAppsPage, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
});

describe(`<${TenantSignInAppsPage.name}/>`, () => {
  beforeEach(() => {
    getAdminByUserIdMock.mockResolvedValue(mockAdmin());
    getTenantByIdMock.mockResolvedValue(mockTenant());
    listTenantOAuthClientsMock.mockResolvedValue([]);
  });

  it('404s a signed-in user who is not an operator', async () => {
    getAdminByUserIdMock.mockResolvedValueOnce(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(listTenantOAuthClientsMock).not.toHaveBeenCalled();
  });

  it("renders the routed tenant's sign-in page without any input", async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: t('pageTitle'),
    });
    const input = screen.queryByRole('textbox');

    expect(heading).toBeVisible();
    expect(input).not.toBeInTheDocument();
  });
});
