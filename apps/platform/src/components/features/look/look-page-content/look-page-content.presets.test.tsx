import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  BUTTON_COLOR_FOLLOWS_PRESET,
  followSwitch,
} from '@platform/testing/look/look-button-color';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import {
  arrangeLookPageQueries,
  setupLookPageContent as setup,
} from '@platform/testing/look/look-page-content-setup';
import {
  getSiteConfigMock,
  selectLiveLocalesMock,
} from '@platform/testing/look/look-page-db';
import { mockSiteConfig } from '@platform/testing/site-config/fixtures';
import {
  mockReadyTenant,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { PRESET_ID, TENANT_PLAN } from '@shinefold/config/constants';
import { MOCK_SHINEFOLD_PRESET_GRANT } from '@shinefold/db/testing/tenant-entitlement-grants/mock-entitlement-grant';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookPageContent } from './look-page-content';

vi.mock('@shinefold/db', async () =>
  (await import('@platform/testing/look/look-page-db')).mockLookPageDb(),
);

vi.mock('@platform/server/settings-features/get-enabled-capabilities');

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/entitlement-grants/grant-entitlement-action');

const { shinefold: SHINEFOLD } = messages.presetPicker;
const GRANTED = messages.grantedBadge.label;
const GRANT_TRIGGER = {
  name: makeEnTranslator('grantEntitlement')('presetTrigger', {
    preset: SHINEFOLD,
  }),
};
const GRANTED_TENANT = mockTenant({ plan: TENANT_PLAN.GROWTH }, [
  MOCK_SHINEFOLD_PRESET_GRANT,
]);

describe(`<${LookPageContent.name}/> the Shinefold preset`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    arrangeLookPageQueries({
      getSiteConfig: getSiteConfigMock,
      selectLiveLocalesWithin: selectLiveLocalesMock,
    });
    getSiteConfigMock.mockResolvedValue(mockSiteConfig());
  });

  describe('for an owner without its grant', () => {
    beforeEach(async () => {
      await setup({ tenant: mockReadyTenant({ plan: TENANT_PLAN.GROWTH }) });
    });

    it('is not offered', () => {
      const shinefoldPreset = screen.queryByRole('radio', { name: SHINEFOLD });
      expect(shinefoldPreset).not.toBeInTheDocument();
    });

    it('offers no grant', () => {
      const grantButton = screen.queryByRole('button', GRANT_TRIGGER);
      expect(grantButton).not.toBeInTheDocument();
    });
  });

  it('is offered with its grant', async () => {
    await setup({
      tenant: mockTenant({ plan: TENANT_PLAN.FREE }, [
        MOCK_SHINEFOLD_PRESET_GRANT,
      ]),
    });

    const shinefoldPreset = screen.getByRole('radio', { name: SHINEFOLD });
    expect(shinefoldPreset).toBeVisible();
  });

  it('badges the offered Shinefold preset as granted', async () => {
    await setup({ tenant: GRANTED_TENANT });

    const shinefoldPreset = screen.getByRole('radio', { name: SHINEFOLD });
    expect(shinefoldPreset).toHaveAccessibleDescription(
      expect.stringContaining(GRANTED),
    );
  });

  it('offers a super admin the grant while the tenant lacks it', async () => {
    await setup({
      tenant: mockReadyTenant({ plan: TENANT_PLAN.GROWTH }),
      canGrantEntitlements: true,
    });

    const grantButton = screen.getByRole('button', GRANT_TRIGGER);
    expect(grantButton).toBeVisible();
  });

  it('offers no grant once the tenant holds it', async () => {
    await setup({ tenant: GRANTED_TENANT, canGrantEntitlements: true });

    const grantButton = screen.queryByRole('button', GRANT_TRIGGER);
    expect(grantButton).not.toBeInTheDocument();
  });

  it('opens an unsaved Shinefold button colour following the preset', async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({ preset: PRESET_ID.SHINEFOLD, buttonColor: undefined }),
    );
    await setup({ tenant: GRANTED_TENANT });
    await openLookRow(user, LOOK_ROW.COLOUR);

    const presetSwitch = followSwitch(BUTTON_COLOR_FOLLOWS_PRESET);
    expect(presetSwitch).toBeChecked();
  });
});
