import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
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

const { shinefold: SHINEFOLD } = messages.presetPicker;

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

  it('is not offered without its grant', async () => {
    await setup({ tenant: mockReadyTenant({ plan: TENANT_PLAN.GROWTH }) });

    const shinefoldPreset = screen.queryByRole('radio', { name: SHINEFOLD });
    expect(shinefoldPreset).not.toBeInTheDocument();
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

  it('opens an unsaved Shinefold button colour following the preset', async () => {
    getSiteConfigMock.mockResolvedValue(
      mockSiteConfig({ preset: PRESET_ID.SHINEFOLD, buttonColor: undefined }),
    );
    await setup({
      tenant: mockTenant({ plan: TENANT_PLAN.GROWTH }, [
        MOCK_SHINEFOLD_PRESET_GRANT,
      ]),
    });
    await openLookRow(user, LOOK_ROW.BUTTONS);

    const presetSwitch = followSwitch(BUTTON_COLOR_FOLLOWS_PRESET);
    expect(presetSwitch).toBeChecked();
  });
});
