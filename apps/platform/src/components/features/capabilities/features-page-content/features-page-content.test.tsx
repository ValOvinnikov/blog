import { CAPABILITY, type TPresetId } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import messages from '@platform/i18n/messages/en.json';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockSettingsFeaturesValues } from '@platform/testing/settings-features/fixtures';
import {
  mockReadyTenant,
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import type { TSettingsFeaturesValues } from '@platform/utils/settings-features-fields/settings-features-fields';

import { FeaturesPageContent } from './features-page-content';

const { getSettingsFeaturesAndPresetMock } = vi.hoisted(() => ({
  getSettingsFeaturesAndPresetMock: vi.fn<
    (
      tenantId: string,
    ) => Promise<{ features?: TSettingsFeaturesValues; preset?: TPresetId }>
  >(async () => ({})),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    settingsFeatures: {
      getSettingsFeaturesAndPreset: getSettingsFeaturesAndPresetMock,
    },
  },
}));

vi.mock('@platform/server/auth/auth');

const { toggleLabel } = messages.featuresSettings;

const setup = customRenderAsync(FeaturesPageContent, {
  tenant: mockReadyTenant({ plan: TENANT_PLAN.FREE }),
});

describe(`<${FeaturesPageContent.name}/>`, () => {
  it("shows the tenant's saved feature toggles", async () => {
    getSettingsFeaturesAndPresetMock.mockResolvedValueOnce({
      features: mockSettingsFeaturesValues({ analyticsEnabled: true }),
    });

    await setup({ tenant: mockReadyTenant({ plan: TENANT_PLAN.GROWTH }) });

    const bookmarksSwitch = screen.getByRole('switch', {
      name: toggleLabel[CAPABILITY.BOOKMARKS],
    });
    const analyticsSwitch = screen.getByRole('switch', {
      name: toggleLabel[CAPABILITY.ANALYTICS],
    });

    expect(getSettingsFeaturesAndPresetMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
    expect(bookmarksSwitch).not.toBeChecked();
    expect(analyticsSwitch).toBeChecked();
  });

  it('enables the Growth-only toggles on the Growth plan', async () => {
    await setup({ tenant: mockReadyTenant({ plan: TENANT_PLAN.GROWTH }) });

    const analyticsSwitch = screen.getByRole('switch', {
      name: toggleLabel[CAPABILITY.ANALYTICS],
    });
    const bookmarksSwitch = screen.getByRole('switch', {
      name: toggleLabel[CAPABILITY.BOOKMARKS],
    });

    expect(analyticsSwitch).toBeEnabled();
    expect(bookmarksSwitch).toBeEnabled();
  });

  describe('on the Free plan', () => {
    it('locks the Growth-only toggles', async () => {
      await setup();

      const analyticsSwitch = screen.getByRole('switch', {
        name: toggleLabel[CAPABILITY.ANALYTICS],
      });
      const bookmarksSwitch = screen.getByRole('switch', {
        name: toggleLabel[CAPABILITY.BOOKMARKS],
      });
      const consentSwitch = screen.getByRole('switch', {
        name: toggleLabel[CAPABILITY.CONSENT_BANNER],
      });

      expect(analyticsSwitch).toBeDisabled();
      expect(bookmarksSwitch).toBeDisabled();
      expect(consentSwitch).toBeEnabled();
    });

    it('unchecks a Growth-only toggle left on by a plan downgrade', async () => {
      getSettingsFeaturesAndPresetMock.mockResolvedValueOnce({
        features: mockSettingsFeaturesValues({ analyticsEnabled: true }),
      });

      await setup();

      const analyticsSwitch = screen.getByRole('switch', {
        name: toggleLabel[CAPABILITY.ANALYTICS],
      });

      expect(analyticsSwitch).not.toBeChecked();
      expect(analyticsSwitch).toBeDisabled();
    });
  });

  it('shows the archived notice and offers no Save for an archived tenant', async () => {
    await setup({
      tenant: mockReadyTenant({
        plan: TENANT_PLAN.FREE,
        deprovisionedAt: MOCK_ARCHIVED_AT,
      }),
    });

    expectArchivedOffersNoSave();
  });
});
