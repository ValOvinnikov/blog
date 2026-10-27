import { LOCALE_ISO_CODES, NEXT_NAVIGATION_ERROR } from '@blog/config';
import en from '@platform/i18n/messages/en.json';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockTenant, MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import VoicePage from './page';

const { getAdminByUserIdMock, getTenantByIdMock, getSiteConfigMock } =
  vi.hoisted(() => ({
    getAdminByUserIdMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
    getSiteConfigMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: {
      getTenantById: getTenantByIdMock,
      selectLiveLocales: vi.fn(() => [LOCALE_ISO_CODES.EN]),
    },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

const setup = customRenderAsync(VoicePage, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
});

describe(`<${VoicePage.name}/>`, () => {
  beforeEach(() => {
    getAdminByUserIdMock.mockResolvedValue(mockAdmin());
    getTenantByIdMock.mockResolvedValue(mockTenant());
  });

  it('404s a signed-in user who is not an operator', async () => {
    getAdminByUserIdMock.mockResolvedValueOnce(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it("renders the routed tenant's Voice settings", async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      name: en.voiceSettings.heading,
    });

    expect(heading).toBeVisible();
    expect(getSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });
});
