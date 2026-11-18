import messages from '@platform/i18n/messages/en.json';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { expectArchivedOffersNoSave } from '@platform/testing/assert-archived-save';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockSettingsFeaturesValues } from '@platform/testing/settings-features/fixtures';
import {
  mockReadyTenant,
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
  mockEntitlementGrant,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import type { TSettingsFeaturesValues } from '@platform/utils/settings-features-fields/settings-features-fields';
import {
  CAPABILITY,
  type TMaybeUndefined,
  type TPresetId,
} from '@shinefold/config';
import { ANALYTICS_PROVIDER, TENANT_PLAN } from '@shinefold/config/constants';
import type { TTenantAnalytics } from '@shinefold/db/queries/tenant-analytics';
import { MOCK_GOOGLE_ANALYTICS } from '@shinefold/db/testing/tenant-analytics/fixtures';

import { FeaturesPageContent } from './features-page-content';

const { getSettingsFeaturesAndPresetMock, getStoredTenantAnalyticsMock } =
  vi.hoisted(() => ({
    getSettingsFeaturesAndPresetMock: vi.fn<
      (
        tenantId: string,
      ) => Promise<{ features?: TSettingsFeaturesValues; preset?: TPresetId }>
    >(async () => ({})),
    getStoredTenantAnalyticsMock: vi.fn<
      (tenantId: string) => Promise<TMaybeUndefined<TTenantAnalytics>>
    >(async () => undefined),
  }));

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    settingsFeatures: {
      getSettingsFeaturesAndPreset: getSettingsFeaturesAndPresetMock,
    },
    tenantAnalytics: {
      getStoredTenantAnalytics: getStoredTenantAnalyticsMock,
    },
  },
}));

vi.mock('@platform/server/auth/auth');

const { toggleLabel, analyticsIdLabel } = messages.featuresSettings;
const MEASUREMENT_ID_LABEL =
  analyticsIdLabel[ANALYTICS_PROVIDER.GOOGLE_ANALYTICS];

const setup = customRenderAsync(FeaturesPageContent, {
  tenant: mockReadyTenant({ plan: TENANT_PLAN.FREE }),
});

describe(`<${FeaturesPageContent.name}/>`, () => {
  it("shows the tenant's saved feature toggles", async () => {
    getSettingsFeaturesAndPresetMock.mockResolvedValueOnce({
      features: mockSettingsFeaturesValues({ contactFormEnabled: true }),
    });

    await setup({ tenant: mockReadyTenant({ plan: TENANT_PLAN.GROWTH }) });

    const bookmarksSwitch = screen.getByRole('switch', {
      name: toggleLabel[CAPABILITY.BOOKMARKS],
    });
    const contactFormSwitch = screen.getByRole('switch', {
      name: toggleLabel[CAPABILITY.CONTACT_FORM],
    });

    expect(getSettingsFeaturesAndPresetMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
    expect(bookmarksSwitch).not.toBeChecked();
    expect(contactFormSwitch).toBeChecked();
  });

  it('enables the Growth-only toggles on the Growth plan', async () => {
    await setup({ tenant: mockReadyTenant({ plan: TENANT_PLAN.GROWTH }) });

    const readerAccountsSwitch = screen.getByRole('switch', {
      name: toggleLabel[CAPABILITY.READER_ACCOUNTS],
    });

    expect(readerAccountsSwitch).toBeEnabled();
  });

  describe('on the Free plan', () => {
    it('locks the Growth-only toggles', async () => {
      await setup();

      const readerAccountsSwitch = screen.getByRole('switch', {
        name: toggleLabel[CAPABILITY.READER_ACCOUNTS],
      });
      const bookmarksSwitch = screen.getByRole('switch', {
        name: toggleLabel[CAPABILITY.BOOKMARKS],
      });
      const consentSwitch = screen.getByRole('switch', {
        name: toggleLabel[CAPABILITY.CONSENT_BANNER],
      });

      expect(readerAccountsSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(bookmarksSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(consentSwitch).toBeEnabled();
    });

    it('unchecks a Growth-only toggle left on by a plan downgrade', async () => {
      getSettingsFeaturesAndPresetMock.mockResolvedValueOnce({
        features: mockSettingsFeaturesValues({ bookmarksEnabled: true }),
      });

      await setup();

      const bookmarksSwitch = screen.getByRole('switch', {
        name: toggleLabel[CAPABILITY.BOOKMARKS],
      });

      expect(bookmarksSwitch).not.toBeChecked();
      expect(bookmarksSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
    });

    describe('with a Google Analytics id kept from a paid plan', () => {
      beforeEach(async () => {
        getStoredTenantAnalyticsMock.mockResolvedValueOnce(
          MOCK_GOOGLE_ANALYTICS,
        );
        await setup();
      });

      it('leaves the consent banner off and unlocked', () => {
        const consentSwitch = screen.getByRole('switch', {
          name: toggleLabel[CAPABILITY.CONSENT_BANNER],
        });

        expect(consentSwitch).not.toBeChecked();
        expect(consentSwitch).toBeEnabled();
      });

      it('shows the id read-only', () => {
        const field = screen.getByRole('textbox', {
          name: MEASUREMENT_ID_LABEL,
        });

        expect(getStoredTenantAnalyticsMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
        );
        expect(field).toHaveValue(MOCK_GOOGLE_ANALYTICS.analyticsId);
        expect(field).toHaveAttribute('readonly');
      });
    });
  });

  it('shows the consent banner on and locked while a Google Analytics id is stored', async () => {
    getStoredTenantAnalyticsMock.mockResolvedValueOnce(MOCK_GOOGLE_ANALYTICS);

    await setup({ tenant: mockReadyTenant({ plan: TENANT_PLAN.STARTER }) });

    const consentSwitch = screen.getByRole('switch', {
      name: toggleLabel[CAPABILITY.CONSENT_BANNER],
    });

    expect(consentSwitch).toBeChecked();
    expect(consentSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
  });

  it('lets a Starter owner edit the analytics id', async () => {
    await setup({ tenant: mockReadyTenant({ plan: TENANT_PLAN.STARTER }) });

    const field = screen.getByRole('textbox', { name: MEASUREMENT_ID_LABEL });

    expect(field).toHaveValue('');
    expect(field).not.toHaveAttribute('readonly');
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

  describe('grants', () => {
    const grantTrigger = {
      name: makeEnTranslator('grantEntitlement')('triggerAriaLabel', {
        item: toggleLabel[CAPABILITY.READER_ACCOUNTS],
      }),
    };

    it('unlocks a capability granted beyond the plan and says it is granted', async () => {
      await setup({
        tenant: mockTenant({ plan: TENANT_PLAN.FREE }, [
          mockEntitlementGrant({ key: CAPABILITY.READER_ACCOUNTS }),
        ]),
      });

      const readerAccountsSwitch = screen.getByRole('switch', {
        name: toggleLabel[CAPABILITY.READER_ACCOUNTS],
      });
      const granted = screen.getByText(messages.grantedBadge.label);

      expect(readerAccountsSwitch).toBeEnabled();
      expect(granted).toBeVisible();
    });

    it('offers the grant action when the page may grant', async () => {
      await setup({ canGrantEntitlements: true });

      const grant = screen.getByRole('button', grantTrigger);

      expect(grant).toBeVisible();
    });

    it('offers no grant action by default', async () => {
      await setup();

      const grant = screen.queryByRole('button', grantTrigger);

      expect(grant).not.toBeInTheDocument();
    });

    it('offers no grant action on an archived tenant', async () => {
      await setup({
        canGrantEntitlements: true,
        tenant: mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
      });

      const grant = screen.queryByRole('button', grantTrigger);

      expect(grant).not.toBeInTheDocument();
    });
  });
});
