import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import en from '@platform/i18n/messages/en.json';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockUnsavedSettingsFeaturesAndPreset } from '@platform/testing/settings-features/fixtures';
import { mockTenant, MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import FeaturesPage from './page';

const {
  getAdminByUserIdMock,
  getTenantByIdMock,
  getSettingsFeaturesAndPresetMock,
} = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  getSettingsFeaturesAndPresetMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
    settingsFeatures: {
      getSettingsFeaturesAndPreset: getSettingsFeaturesAndPresetMock,
    },
  },
}));

const setup = customRenderAsync(FeaturesPage, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
});

describe(`<${FeaturesPage.name}/>`, () => {
  beforeEach(() => {
    getAdminByUserIdMock.mockResolvedValue(mockAdmin());
    getTenantByIdMock.mockResolvedValue(mockTenant());
    getSettingsFeaturesAndPresetMock.mockResolvedValue(
      mockUnsavedSettingsFeaturesAndPreset(),
    );
  });

  it('404s a signed-in user who is not an operator', async () => {
    getAdminByUserIdMock.mockResolvedValueOnce(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(getSettingsFeaturesAndPresetMock).not.toHaveBeenCalled();
  });

  it("renders the routed tenant's Features settings", async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      name: en.featuresSettings.heading,
    });

    expect(heading).toBeVisible();
    expect(getSettingsFeaturesAndPresetMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
  });
});
