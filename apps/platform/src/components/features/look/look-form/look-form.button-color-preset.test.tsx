import { LOOK_ROW } from '@platform/constants/look-row';
import { SITE_THEME_BUTTON_STYLE_TEST_ID } from '@platform/constants/site-theme-frame';
import { screen } from '@platform/testing/custom-render';
import {
  BUTTON_COLOR_FOLLOWS_PRESET,
  followSwitch,
} from '@platform/testing/look/look-button-color';
import { RESET_TO_PRESET } from '@platform/testing/look/look-form-fixtures';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { saveAndExpectLook } from '@platform/testing/look/look-form-save';
import {
  setupLookForm,
  withLookTenant,
} from '@platform/testing/look/look-form-setup';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { PRESET_ID } from '@shinefold/config';
import { MOCK_PINK_HEX } from '@shinefold/config/testing/button-colors';
import { SHINEFOLD_LOGO_COLOR } from '@shinefold/utils/shinefold-logo';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const MOCK_SHINEFOLD_TENANT = withLookTenant({
  unlockedPresets: [PRESET_ID.SHINEFOLD],
});

const setupShinefold = (buttonColor?: string) =>
  setupLookForm({
    ...MOCK_SHINEFOLD_TENANT,
    initialValues: {
      ...defaultLookFormValues(),
      preset: PRESET_ID.SHINEFOLD,
      buttonColor,
    },
  });

const previewedButtonStyle = () => {
  const [buttonStyle] = screen.queryAllByTestId(
    SITE_THEME_BUTTON_STYLE_TEST_ID,
  );
  return buttonStyle;
};

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('follows and previews the preset colour under Shinefold when none is saved', async () => {
    setupShinefold();
    await openLookRow(user, LOOK_ROW.BUTTONS);

    const presetSwitch = followSwitch(BUTTON_COLOR_FOLLOWS_PRESET);
    expect(presetSwitch).toBeChecked();
    expect(previewedButtonStyle()).toHaveTextContent(
      SHINEFOLD_LOGO_COLOR.YELLOW,
    );
  });

  describe('under Shinefold with a saved colour', () => {
    beforeEach(async () => {
      setupShinefold(MOCK_PINK_HEX);
      await openLookRow(user, LOOK_ROW.BUTTONS);
    });

    it('saves no colour once it follows the preset again', async () => {
      await user.click(followSwitch(BUTTON_COLOR_FOLLOWS_PRESET));

      expect(previewedButtonStyle()).toHaveTextContent(
        SHINEFOLD_LOGO_COLOR.YELLOW,
      );
      await saveAndExpectLook(user, { preset: PRESET_ID.SHINEFOLD });
    });

    it('clears it on Reset to preset', async () => {
      const resetToPresetButton = screen.getByRole('button', {
        name: RESET_TO_PRESET,
      });
      await user.click(resetToPresetButton);

      const presetSwitch = followSwitch(BUTTON_COLOR_FOLLOWS_PRESET);
      expect(presetSwitch).toBeChecked();
    });
  });
});
